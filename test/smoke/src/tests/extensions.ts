/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';

import { SpectronApplication, LATEST_PATH, WORKSPACE_PATH, EXTENSIONS_DIR } from "../spectron/application";
import { CommonActions } from '../areas/common';
import { Extensions } from "../areas/extensions";

var dns = require('dns');

let app: SpectronApplication;
let common: CommonActions;

export function testExtensions() {

	context('Extensions', () => {
		let extensions: Extensions;

		beforeEach(async function () {
			const network = await networkAttached();
			if (!network) {
				return Promise.reject('There is no network connection for testing extensions.');
			}

			app = new SpectronApplication(LATEST_PATH, this.currentTest.fullTitle(), (this.currentTest as any).currentRetry(), [WORKSPACE_PATH, `--extensions-dir=${EXTENSIONS_DIR}`]);
			common = new CommonActions(app);
			extensions = new Extensions(app, common);
			await common.removeDirectory(EXTENSIONS_DIR);

			return await app.start();
		});
		afterEach(async function () {
			await app.stop();
			return await common.removeDirectory(EXTENSIONS_DIR);
		});

		it(`installs 'vscode-icons' extension and verifies reload is prompted`, async function () {
			const name = 'vscode-icons';
			await extensions.openExtensionsViewlet();
			await extensions.searchForExtension(name);
			await app.wait();
			await extensions.installExtension(name);
			await app.wait();
			assert.ok(await extensions.getExtensionReloadText(), 'Reload was not prompted after extension installation.');
		});

		it(`installs an extension and checks if it works on restart`, async function () {
			const name = 'vscode-icons';
			await extensions.openExtensionsViewlet();
			await extensions.searchForExtension(name);
			await app.wait();
			await extensions.installExtension(name);
			await app.wait();
			await extensions.getExtensionReloadText();

			await app.stop();
			await app.wait(); // wait until all resources are released (e.g. locked local storage)
			await app.start();
			await extensions.selectMinimalIconsTheme();
			const x = await extensions.verifyFolderIconAppearance();
			assert.ok(x);
		});
	});
}

function networkAttached(): Promise<boolean> {
	return new Promise((res, rej) => {
		dns.resolve('marketplace.visualstudio.com', (err) => {
			err ? res(false) : res(true);
		});
	});
}