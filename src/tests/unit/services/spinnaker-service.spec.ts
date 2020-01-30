import { Test } from '@nestjs/testing'
import { SpinnakerService } from '../../../app/core/integrations/spinnaker'
import {
  ConsoleLoggerServiceStub,
  HttpServiceStub,
  MooveServiceStub,
  PipelineQueuesServiceStub,
  StatusManagementServiceStub
} from '../../stubs/services'
import { ConsulConfigurationStub } from '../../stubs/configurations'
import { StatusManagementService } from '../../../app/core/services/deployments'
import { ConsoleLoggerService } from '../../../app/core/logs/console'
import { AppConstants } from '../../../app/core/constants'
import { AxiosResponse } from 'axios'
import { of } from 'rxjs'
import { MooveService } from '../../../app/core/integrations/moove'
import { PipelineQueuesService } from '../../../app/api/deployments/services'
import {
  ComponentUndeploymentsRepository,
  QueuedDeploymentsRepository
} from '../../../app/api/deployments/repository'
import {
  ComponentUndeploymentsRepositoryStub,
  DeploymentsRepositoryStub,
  QueuedDeploymentsRepositoryStub
} from '../../stubs/repository'
import { HttpService } from '@nestjs/common'
import { IPipelineOptions } from '../../../app/api/components/interfaces'
import { IDeploymentConfiguration } from '../../../app/core/integrations/configuration/interfaces'
import { Repository } from 'typeorm'
import {
  CircleDeploymentEntity,
  DeploymentEntity,
  QueuedDeploymentEntity
} from '../../../app/api/deployments/entity'
import {
  DeploymentStatusEnum,
  QueuedPipelineStatusEnum
} from '../../../app/api/deployments/enums'
import { NotificationStatusEnum } from '../../../app/api/notifications/enums'

describe('Spinnaker Service', () => {
  let spinnakerService: SpinnakerService
  let httpService: HttpService
  let defaultAxiosGetResponse: AxiosResponse
  let defaultAxiosPostResponse: AxiosResponse
  let pipelineOptions: IPipelineOptions
  let deploymentConfiguration: IDeploymentConfiguration
  let deploymentsRepository: Repository<DeploymentEntity>
  let deployment: DeploymentEntity
  let circle: CircleDeploymentEntity
  let statusManagementService: StatusManagementService
  let mooveService: MooveService
  let pipelineQueuesService: PipelineQueuesService
  let queuedDeploymentsRepository: QueuedDeploymentsRepository
  let queuedDeployment: QueuedDeploymentEntity

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        SpinnakerService,
        { provide: HttpService, useClass: HttpServiceStub },
        { provide: StatusManagementService, useClass: StatusManagementServiceStub },
        { provide: ConsoleLoggerService, useClass: ConsoleLoggerServiceStub },
        { provide: AppConstants.CONSUL_PROVIDER, useValue: ConsulConfigurationStub },
        { provide: 'DeploymentEntityRepository', useClass: DeploymentsRepositoryStub },
        { provide: MooveService, useClass: MooveServiceStub },
        { provide: PipelineQueuesService, useClass: PipelineQueuesServiceStub },
        { provide: QueuedDeploymentsRepository, useClass: QueuedDeploymentsRepositoryStub },
        { provide: ComponentUndeploymentsRepository, useClass: ComponentUndeploymentsRepositoryStub },
      ]
    }).compile()

    spinnakerService = module.get<SpinnakerService>(SpinnakerService)
    httpService = module.get<HttpService>(HttpService)
    deploymentsRepository = module.get<Repository<DeploymentEntity>>('DeploymentEntityRepository')
    statusManagementService = module.get<StatusManagementService>(StatusManagementService)
    mooveService = module.get<MooveService>(MooveService)
    pipelineQueuesService = module.get<PipelineQueuesService>(PipelineQueuesService)
    queuedDeploymentsRepository = module.get<QueuedDeploymentsRepository>(QueuedDeploymentsRepository)

    defaultAxiosGetResponse = {
      data: {
        id: 'some-pipeline-id',
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    }

    defaultAxiosPostResponse = {
      data: {
        id: 'some-pipeline-id',
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    }

    pipelineOptions = { pipelineCircles: [], pipelineVersions: [], pipelineUnusedVersions: [] }

    deploymentConfiguration = {
      account: 'some-account',
      pipelineName: 'some-pipeline-name',
      applicationName: 'some-application-name',
      appName: 'some-app-name',
      appNamespace: 'some-app-namespace',
      healthCheckPath: '/health',
      uri: { uriName: 'https://some.uri' },
      appPort: 8989
    }

    circle = new CircleDeploymentEntity('dummy-circle', false)

    deployment = new DeploymentEntity(
        'dummy-deployment-id',
        'dummy-application-name',
        null,
        'dummy-author-id',
        'dummy-description',
        'dummy-callback-url',
        circle,
        false,
        'dummy-circle-id'
    )

    queuedDeployment = new QueuedDeploymentEntity(
        'dummy-component-id',
        'dummy-component-deployment-id3',
        QueuedPipelineStatusEnum.QUEUED,
    )
  })

  describe('deploySpinnakerPipeline', () => {

    it('should call spinnaker api with application name and module name', async () => {
      jest.spyOn(httpService, 'post')
          .mockImplementation(() => of(defaultAxiosPostResponse))
      jest.spyOn(spinnakerService, 'waitForPipelineCreation')
          .mockImplementation(() => Promise.resolve())

      const httpPostSpy = jest.spyOn(httpService, 'post')

      await spinnakerService.deploySpinnakerPipeline(
          'some-pipeline-name',
          'some-application-name',
          'deployment-id',
          100
      )

      expect(httpPostSpy).nthCalledWith(
          1,
          'spinnakerurl.com/pipelines/some-application-name/some-pipeline-name',
          {},
          { headers: { 'Content-Type': 'application/json' } }
      )
    })

    it('should handle spinnaker deployment api call failure correctly', async () => {
      jest.spyOn(httpService, 'post')
          .mockImplementation(() => { throw new Error() })

      jest.spyOn(spinnakerService, 'waitForPipelineCreation')
          .mockImplementation(() => Promise.resolve())

      jest.spyOn(deploymentsRepository, 'findOne')
          .mockImplementation(() => Promise.resolve(deployment))

      jest.spyOn(queuedDeploymentsRepository, 'findOne')
          .mockImplementation(() => Promise.resolve(queuedDeployment))

      const statusSpy = jest.spyOn(statusManagementService, 'deepUpdateDeploymentStatus')
      const applicationSpy = jest.spyOn(mooveService, 'notifyDeploymentStatus')
      const finishedSpy = jest.spyOn(pipelineQueuesService, 'setQueuedDeploymentStatusFinished')
      const triggerSpy = jest.spyOn(pipelineQueuesService, 'triggerNextComponentPipeline')

      await spinnakerService.deploySpinnakerPipeline(
          'some-pipeline-name',
          'some-application-name',
          'deployment-id',
          100
      )

      expect(statusSpy)
          .toHaveBeenNthCalledWith(1, deployment, DeploymentStatusEnum.FAILED)
      expect(applicationSpy)
          .toHaveBeenNthCalledWith(1, deployment.id, NotificationStatusEnum.FAILED, deployment.callbackUrl, deployment.circleId)
      expect(finishedSpy)
          .toHaveBeenNthCalledWith(1, queuedDeployment.id)
      expect(triggerSpy)
          .toHaveBeenNthCalledWith(1, queuedDeployment.componentDeploymentId)
    })
  })
})
