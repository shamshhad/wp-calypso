/* eslint-disable wpcalypso/jsx-classname-namespace */
/**
 * External dependencies
 */
import React, { useState } from 'react';

/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Language, LanguageGroup } from './Language';
import { getSearchedLanguages, LocalizedLanguageNames } from './search';

/**
 * Style dependencies
 */
import './style.scss';

type Props = {
	onSelectLanguage: ( language: Language ) => void;
	languages: Language[];
	languageGroups: LanguageGroup[];
	selectedLanguage?: Language;
	search?: string;
	localizedLanguageNames?: LocalizedLanguageNames;
};

const LanguagePicker = ( {
	onSelectLanguage,
	languages,
	languageGroups,
	selectedLanguage,
	search,
	localizedLanguageNames,
}: Props ) => {
	const [ filter, setFilter ] = useState( languageGroups[ 0 ].id );

	const getFilteredLanguages = () => {
		switch ( filter ) {
			case 'popular':
				return languages
					.filter( ( language ) => language.popular )
					.sort( ( a, b ) => ( a.popular as number ) - ( b.popular as number ) );
			default: {
				const languageGroup = languageGroups.find( ( l ) => l.id === filter );
				const subTerritories = languageGroup ? languageGroup.subTerritories : [];
				return languages
					.filter( ( language ) =>
						language.territories.some( ( t ) => subTerritories?.includes( t ) )
					)
					.sort( ( a, b ) => a.name.localeCompare( b.name ) );
			}
		}
	};

	const renderCategoryButtons = () => {
		return languageGroups.map( ( languageGroup ) => {
			const isSelected = filter === languageGroup.id;

			const onClick = () => {
				setFilter( languageGroup.id );
			};

			return (
				<div key={ languageGroup.id }>
					<Button onClick={ onClick } className="language-picker-component__language-group">
						<span className={ isSelected ? 'is-selected' : '' }>{ languageGroup.name() }</span>
					</Button>
				</div>
			);
		} );
	};

	const shouldDisplayRegions = ! search;

	const languagesToRender = search
		? getSearchedLanguages( languages, search, localizedLanguageNames )
		: getFilteredLanguages();

	return (
		<div className="language-picker-component">
			<div className="language-picker-component__labels">
				{ shouldDisplayRegions ? (
					<>
						<div className="language-picker-component__regions-label">{ __( 'regions' ) }</div>
						<div className="language-picker-component__languages-label">{ __( 'language' ) }</div>
					</>
				) : (
					<div className="language-picker-component__search-results-label">
						{ __( 'search result' ) }
					</div>
				) }
			</div>
			<div className="language-picker-component__content">
				{ shouldDisplayRegions && (
					<div className="language-picker-component__category-filters">
						{ renderCategoryButtons() }
					</div>
				) }
				<div className="language-picker-component__language-buttons">
					{ languagesToRender.map( ( language ) => (
						<Button
							isPrimary={ selectedLanguage && language.langSlug === selectedLanguage.langSlug }
							className="language-picker-component__language-button"
							key={ language.langSlug }
							onClick={ () => onSelectLanguage( language ) }
							title={ language.name }
						>
							<span lang={ language.langSlug }>{ language.name }</span>
						</Button>
					) ) }
				</div>
			</div>
		</div>
	);
};

export default LanguagePicker;
