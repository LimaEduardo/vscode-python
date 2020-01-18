// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
'use strict';
import * as typemoq from 'typemoq';
import { IApplicationShell } from '../../client/common/application/types';
import { IInstallationChannelManager, IModuleInstaller } from '../../client/common/installer/types';
import * as localize from '../../client/common/utils/localize';
import { DataScienceErrorHandler } from '../../client/datascience/errorHandler/errorHandler';
import { JupyterCommandInterpreterDependencyService } from '../../client/datascience/jupyter/interpreter/jupyterCommandInterpreterDependencyService';
import { JupyterInstallError } from '../../client/datascience/jupyter/jupyterInstallError';
import { JupyterSelfCertsError } from '../../client/datascience/jupyter/jupyterSelfCertsError';

suite('DataScience Error Handler Unit Tests', () => {
    let applicationShell: typemoq.IMock<IApplicationShell>;
    let channels: typemoq.IMock<IInstallationChannelManager>;
    let dependencyManager: JupyterCommandInterpreterDependencyService;
    let dataScienceErrorHandler: DataScienceErrorHandler;

    setup(() => {
        applicationShell = typemoq.Mock.ofType<IApplicationShell>();
        channels = typemoq.Mock.ofType<IInstallationChannelManager>();
        dependencyManager = new JupyterCommandInterpreterDependencyService(applicationShell.object, channels.object);
        dataScienceErrorHandler = new DataScienceErrorHandler(applicationShell.object, dependencyManager);
    });
    const message = 'Test error message.';

    test('Default error', async () => {
        applicationShell
            .setup(app => app.showErrorMessage(typemoq.It.isAny()))
            .returns(() => Promise.resolve(message))
            .verifiable(typemoq.Times.once());

        const err = new Error(message);
        await dataScienceErrorHandler.handleError(err);

        applicationShell.verifyAll();
    });

    test('Jupyter Self Certificates Error', async () => {
        applicationShell
            .setup(app => app.showErrorMessage(typemoq.It.isAny()))
            .returns(() => Promise.resolve(message))
            .verifiable(typemoq.Times.never());

        const err = new JupyterSelfCertsError(message);
        await dataScienceErrorHandler.handleError(err);

        applicationShell.verifyAll();
    });

    test('Jupyter Install Error', async () => {
        applicationShell
            .setup(app =>
                app.showInformationMessage(
                    typemoq.It.isAny(),
                    typemoq.It.isValue(localize.DataScience.jupyterInstall()),
                    typemoq.It.isValue(localize.DataScience.notebookCheckForImportNo()),
                    typemoq.It.isAny()
                )
            )
            .returns(() => Promise.resolve(localize.DataScience.jupyterInstall()))
            .verifiable(typemoq.Times.once());

        const installers: IModuleInstaller[] = [
            {
                name: 'Pip',
                displayName: 'Pip',
                priority: 0,
                isSupported: () => Promise.resolve(true),
                installModule: () => Promise.resolve()
            },
            {
                name: 'Conda',
                displayName: 'Conda',
                priority: 0,
                isSupported: () => Promise.resolve(true),
                installModule: () => Promise.resolve()
            }
        ];

        channels
            .setup(ch => ch.getInstallationChannels())
            .returns(() => Promise.resolve(installers))
            .verifiable(typemoq.Times.once());

        const err = new JupyterInstallError(message, 'test.com');
        await dataScienceErrorHandler.handleError(err);

        applicationShell.verifyAll();
        channels.verifyAll();
    });
});
