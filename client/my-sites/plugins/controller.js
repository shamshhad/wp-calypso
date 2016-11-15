/**
 * External Dependencies
 */
import ReactDom from 'react-dom';
import React from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import page from 'page';
import some from 'lodash/some';
import includes from 'lodash/includes';
import capitalize from 'lodash/capitalize';

/**
 * Internal Dependencies
 */
import route from 'lib/route';
import notices from 'notices';
import sitesFactory from 'lib/sites-list';
import analytics from 'lib/analytics';
import PlanSetup from './jetpack-plugins-setup';
import PluginListComponent from './main';
import PluginComponent from './plugin';
import PluginBrowser from './plugins-browser';
import { renderWithReduxStore } from 'lib/react-helpers';
import { setSection } from 'state/ui/actions';
import { getSelectedSite, getSection } from 'state/ui/selectors';

/**
 * Module variables
 */
const allowedCategoryNames = [ 'new', 'popular', 'featured' ];
const sites = sitesFactory();

let lastPluginsListVisited,
	lastPluginsQuerystring;

function renderSinglePlugin( context, siteUrl ) {
	const pluginSlug = decodeURIComponent( context.params.plugin );
	const site = getSelectedSite( context.store.getState() );
	const analyticsPageTitle = 'Plugins';

	let baseAnalyticsPath = 'plugins/:plugin';

	if ( site ) {
		baseAnalyticsPath += '/:site';
	}

	analytics
	.pageView
	.record( baseAnalyticsPath, `${ analyticsPageTitle } > Plugin Details` );

	// Scroll to the top
	window.scrollTo( 0, 0 );

	let prevPath;
	if ( lastPluginsListVisited ) {
		prevPath = lastPluginsListVisited;
	} else if ( context.prevPath ) {
		prevPath = route.sectionify( context.prevPath );
	}

	// Render single plugin component
	renderWithReduxStore(
		React.createElement( PluginComponent, {
			path: context.path,
			prevQuerystring: lastPluginsQuerystring,
			prevPath,
			sites,
			pluginSlug,
			siteUrl,
		} ),
		document.getElementById( 'primary' ),
		context.store
	);
}

function getPathWithoutSiteSlug( context, site ) {
	let path = context.pathname;
	if ( site && site.slug ) {
		path = path.replace( '/' + site.slug, '' );
	}
	return path;
}

function renderPluginList( context, basePath ) {
	const search = context.query.s;
	const site = getSelectedSite( context.store.getState() );

	lastPluginsListVisited = getPathWithoutSiteSlug( context, site );
	lastPluginsQuerystring = context.querystring;

	ReactDom.render(
		React.createElement( ReduxProvider, { store: context.store },
			React.createElement( PluginListComponent, {
				path: basePath,
				context,
				filter: context.params.pluginFilter,
				sites,
				search
			} )
		),
		document.getElementById( 'primary' )
	);

	if ( search ) {
		analytics.ga.recordEvent( 'Plugins', 'Search', 'Search term', search );
	}

	const analyticsPageTitle = 'Plugins' +
		( context.params.pluginFilter
			? ' ' + capitalize( context.params.pluginFilter )
			: ''
		);
	let baseAnalyticsPath = 'plugins/';
	if ( site ) {
		baseAnalyticsPath += '/:site';
	}
	analytics
		.pageView
		.record( baseAnalyticsPath, analyticsPageTitle );
}

function renderPluginsBrowser( context ) {
	const searchTerm = context.query.s;
	const site = getSelectedSite( context.store.getState() );
	let { category } = context.params;

	lastPluginsListVisited = getPathWithoutSiteSlug( context, site );
	lastPluginsQuerystring = context.querystring;

	if (
		context.params.siteOrCategory &&
		allowedCategoryNames.indexOf( context.params.siteOrCategory ) >= 0
	) {
		category = context.params.siteOrCategory;
	}

	const analyticsPageTitle = 'Plugin Browser' + ( category ? ': ' + category : '' );
	let baseAnalyticsPath = 'plugins/browser' + ( category ? '/' + category : '' );
	if ( site ) {
		baseAnalyticsPath += '/:site';
	}

	analytics
	.pageView
	.record( baseAnalyticsPath, analyticsPageTitle );

	renderWithReduxStore(
		React.createElement( PluginBrowser, {
			site: site ? site.slug : null,
			path: context.path,
			category,
			sites,
			search: searchTerm
		} ),
		document.getElementById( 'primary' ),
		context.store
	);
}

function renderProvisionPlugins( context ) {
	const state = context.store.getState();
	const section = getSection( state );
	const site = getSelectedSite( state );
	context.store.dispatch( setSection( Object.assign( {}, section, { secondary: false } ) ) );
	ReactDom.unmountComponentAtNode( document.getElementById( 'secondary' ) );
	let baseAnalyticsPath = 'plugins/setup';
	if ( site ) {
		baseAnalyticsPath += '/:site';
	}

	analytics.pageView.record( baseAnalyticsPath, 'Jetpack Plugins Setup' );

	renderWithReduxStore(
		React.createElement( PlanSetup, {
			whitelist: context.query.only || false
		} ),
		document.getElementById( 'primary' ),
		context.store
	);
}

const controller = {
	validateFilters( filter, context, next ) {
		const wpcomFilter = 'standard';
		const siteUrl = route.getSiteFragment( context.path );
		const site = getSelectedSite( context.store.getState() );
		const appliedFilter = ( filter ? filter : context.params.plugin ).toLowerCase();

		// bail if /plugins/:site_id?
		if ( siteUrl && appliedFilter === siteUrl.toString().toLowerCase() ) {
			next();
			return;
		}
		// When site URL is present, bail if ...
		//
		// ... the plugin parameter is not on the WordPress.com list for a WordPress.com site.
		const pluginIsNotInList = site && ! site.jetpack && ! includes( [ 'all', wpcomFilter ], appliedFilter );

		// ... or the plugin parameter is on the WordPress.com list for a Jetpack site.
		// if no site URL is provided, bail if a WordPress.com filter was provided.
		//  Only Jetpack plugins should work when no URL is provided.
		const onlyJetPack = site && site.jetpack && appliedFilter === wpcomFilter;

		if ( siteUrl && ( pluginIsNotInList || onlyJetPack ) ) {
			page.redirect( '/plugins/' + siteUrl );
			return;
		} else if ( ! siteUrl && appliedFilter === wpcomFilter ) {
			page.redirect( '/plugins' );
			return;
		}

		next();
	},

	plugins( filter, context, next ) {
		const siteUrl = route.getSiteFragment( context.path );
		const basePath = route.sectionify( context.path ).replace( '/' + filter, '' );

		// bail if no site is selected and the user has no Jetpack sites.
		if ( ! siteUrl && sites.getJetpack().length === 0 ) {
			return next();
		}

		context.params.pluginFilter = filter;
		notices.clearNotices( 'notices' );
		renderPluginList( context, basePath );
	},

	plugin( context ) {
		const siteUrl = route.getSiteFragment( context.path );

		if (
			siteUrl &&
			context.params.plugin &&
			context.params.plugin === siteUrl.toString()
		) {
			controller.plugins( 'all', context );
			return;
		}

		notices.clearNotices( 'notices' );
		renderSinglePlugin( context, siteUrl );
	},

	browsePlugins( context ) {
		renderPluginsBrowser( context );
	},

	jetpackCanUpdate( filter, context, next ) {
		const selectedSites = sites.getSelectedOrAllWithPlugins();
		let redirectToPlugins = false;

		if ( 'updates' === filter && selectedSites.length ) {
			redirectToPlugins = ! some( sites.getSelectedOrAllWithPlugins(), function( site ) {
				return site && site.jetpack && site.canUpdateFiles;
			} );

			if ( redirectToPlugins ) {
				if ( context.params && context.params.site_id ) {
					page.redirect( `/plugins/${ context.params.site_id }` );
					return;
				}
				page.redirect( '/plugins' );
				return;
			}
		}
		next();
	},

	setupPlugins( context ) {
		renderProvisionPlugins( context );
	},

	resetHistory( context, next ) {
		lastPluginsListVisited = null;
		lastPluginsQuerystring = null;
		next();
	}
};

module.exports = controller;
