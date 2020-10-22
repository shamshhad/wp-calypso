/**
 * External dependencies
 */
import React, { ReactNode, useState } from 'react';
import LanguagePicker, { Language } from '@automattic/language-picker';
import { Dialog } from '@automattic/components';
import { localize } from 'i18n-calypso';
import Search from 'calypso/components/search';

/**
 * WordPress dependencies
 */
import { I18n } from '@wordpress/i18n';
import { Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { LANGUAGE_GROUPS, DEFAULT_LANGUAGE_GROUP } from './constants';

/**
 * Style dependencies
 */
import './modal-2.scss';

type Props = {
	languages: Language[];
	/**
	 * Fires when the modal is dismissed.
	 */
	onClose: () => void;
	/**
	 * Fires when the modal is dismissed with a language selection.
	 */
	onSelectLanguage: ( l: Language ) => void;
	translate: I18n[ '__' ];
	selectedLanguageSlug?: string;
};

const LanguagePickerModal = ( {
	languages,
	onClose,
	onSelectLanguage,
	translate,
	selectedLanguageSlug,
}: Props ): ReactNode => {
	const [ selectedLanguage, setSelectedLanguage ] = useState< Language | undefined >(
		languages.find( ( l ) => l.langSlug === selectedLanguageSlug )
	);
	const [ search, setSearch ] = useState< string | undefined >();
	const [ searchIsOpen, setSearchIsOpen ] = useState( false );

	const buttons = [
		<Button isLink isLarge onClick={ onClose }>
			{ translate( 'Cancel' ) }
		</Button>,
		<Button
			isSecondary
			isLarge
			onClick={ () => {
				onClose();
				if ( selectedLanguage ) {
					onSelectLanguage( selectedLanguage );
				}
			} }
		>
			{ translate( 'Apply Changes' ) }
		</Button>,
	];

	return (
		<Dialog
			isVisible
			onClose={ onClose }
			buttons={ buttons }
			additionalClassNames="language-picker__dialog"
		>
			<LanguagePicker
				languages={ languages }
				languageGroups={ LANGUAGE_GROUPS }
				onSelectLanguage={ setSelectedLanguage }
				selectedLanguage={ selectedLanguage }
			/>
		</Dialog>
	);
};

export default localize( LanguagePickerModal );
