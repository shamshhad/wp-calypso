/**
 * External dependencies
 */
import React, { FunctionComponent } from 'react';
import { useSelector } from 'react-redux';
import { isArray } from 'lodash';

/**
 * Internal dependencies
 */
import BackupFailed from 'calypso/components/jetpack/backup-card/backup-failed';
import NoBackupsOnSelectedDate from 'calypso/components/jetpack/backup-card/no-backups-on-selected-date';
import BackupScheduled from 'calypso/components/jetpack/backup-card/backup-scheduled';
import NoBackupsYet from 'calypso/components/jetpack/backup-card/no-backups-yet';
import BackupCard from 'calypso/components/jetpack/backup-card';
import { useLocalizedMoment } from 'calypso/components/localized-moment';
import {
	isSuccessfulDailyBackup,
	isSuccessfulRealtimeBackup,
} from 'calypso/lib/jetpack/backup-utils';
import { applySiteOffset } from 'calypso/lib/site/timezone';
import getSiteGmtOffset from 'calypso/state/selectors/get-site-gmt-offset';
import getRewindCapabilities from 'calypso/state/selectors/get-rewind-capabilities';
import getSiteTimezoneValue from 'calypso/state/selectors/get-site-timezone-value';
import getSelectedSiteId from 'calypso/state/ui/selectors/get-selected-site-id';

/**
 * Style dependencies
 */
import './style.scss';

/**
 * Type dependencies
 */
import type { Moment } from 'moment';
import type { Activity } from 'calypso/state/activity-log/types';

type Props = {
	selectedDate: Moment;
	lastBackupDate?: Moment;
	backup: Activity;
	isLatestBackup?: boolean;
	dailyDeltas?: Activity[];
};

const DailyBackupStatusAlternate: FunctionComponent< Props > = ( {
	selectedDate,
	lastBackupDate,
	backup,
	isLatestBackup,
	dailyDeltas,
} ) => {
	const moment = useLocalizedMoment();

	const siteId = useSelector( getSelectedSiteId );
	const capabilities = useSelector( ( state ) =>
		siteId ? getRewindCapabilities( state, siteId ) : null
	);
	const timezone = useSelector( ( state ) =>
		siteId ? getSiteTimezoneValue( state, siteId ) : null
	);
	const gmtOffset = useSelector( ( state ) =>
		siteId ? getSiteGmtOffset( state, siteId ) : null
	);

	if ( backup ) {
		const isSuccessful =
			isArray( capabilities ) && capabilities.includes( 'backup-realtime' )
				? isSuccessfulRealtimeBackup
				: isSuccessfulDailyBackup;

		return isSuccessful( backup ) ? (
			<BackupCard
				activity={ backup }
				subActivities={ dailyDeltas }
				isLatest={ !! isLatestBackup }
				isFeatured
			/>
		) : (
			<BackupFailed backup={ backup } isFeatured />
		);
	}

	if ( lastBackupDate ) {
		const today = applySiteOffset( moment(), {
			timezone: timezone,
			gmtOffset: gmtOffset,
		} );

		return selectedDate.isSame( today, 'day' ) ? (
			<BackupScheduled lastBackupDate={ lastBackupDate } isFeatured />
		) : (
			<NoBackupsOnSelectedDate selectedDate={ selectedDate } isFeatured />
		);
	}

	return <NoBackupsYet isFeatured />;
};

export default DailyBackupStatusAlternate;
