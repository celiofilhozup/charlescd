import { Test } from '@nestjs/testing'
import {
    ComponentDeploymentsRepositoryStub,
    ComponentUndeploymentsRepositoryStub,
    DeploymentsRepositoryStub,
    ModuleDeploymentsRepositoryStub,
    ModuleUndeploymentsRepositoryStub,
    UndeploymentsRepositoryStub
} from '../../stubs/repository'
import { StatusManagementService } from '../../../app/core/services/deployments'
import {
    CircleDeploymentEntity,
    ComponentDeploymentEntity,
    ComponentUndeploymentEntity,
    DeploymentEntity,
    ModuleDeploymentEntity,
    ModuleUndeploymentEntity,
    UndeploymentEntity
} from '../../../app/api/deployments/entity'
import {
    ComponentDeploymentsRepository,
    ComponentUndeploymentsRepository
} from '../../../app/api/deployments/repository'
import { Repository } from 'typeorm'
import {
    DeploymentStatusEnum,
    UndeploymentStatusEnum
} from '../../../app/api/deployments/enums'

describe('PipelinesService', () => {

    let statusManagementService: StatusManagementService
    let componentDeploymentsRepository: ComponentDeploymentsRepository
    let componentUndeploymentsRepository: ComponentUndeploymentsRepository
    let moduleDeploymentsRepository: Repository<ModuleDeploymentEntity>
    let moduleUndeploymentsRepository: Repository<ModuleUndeploymentEntity>
    let deploymentsRepository: Repository<DeploymentEntity>
    let undeploymentsRepository: Repository<UndeploymentEntity>
    let deployment: DeploymentEntity
    let deploymentWithRelations: DeploymentEntity
    let moduleDeployment: ModuleDeploymentEntity
    let moduleDeploymentWithRelations: ModuleDeploymentEntity
    let moduleDeploymentsList: ModuleDeploymentEntity[]
    let componentDeployment: ComponentDeploymentEntity
    let componentDeploymentsList: ComponentDeploymentEntity[]
    let circle: CircleDeploymentEntity
    let undeployment: UndeploymentEntity
    let moduleUndeployment: ModuleUndeploymentEntity
    let componentUndeployment: ComponentUndeploymentEntity
    let componentUndeploymentsList: ComponentUndeploymentEntity[]
    let moduleUndeploymentWithRelations: ModuleUndeploymentEntity

    beforeEach(async () => {

        const module = await Test.createTestingModule({
            providers: [
                StatusManagementService,
                { provide: 'DeploymentEntityRepository', useClass: DeploymentsRepositoryStub },
                { provide: 'ModuleDeploymentEntityRepository', useClass: ModuleDeploymentsRepositoryStub },
                { provide: ComponentDeploymentsRepository, useClass: ComponentDeploymentsRepositoryStub },
                { provide: ComponentUndeploymentsRepository, useClass: ComponentUndeploymentsRepositoryStub },
                { provide: 'ModuleUndeploymentEntityRepository', useClass: ModuleUndeploymentsRepositoryStub },
                { provide: 'UndeploymentEntityRepository', useClass: UndeploymentsRepositoryStub }
            ]
        }).compile()

        statusManagementService = module.get<StatusManagementService>(StatusManagementService)
        componentDeploymentsRepository = module.get<ComponentDeploymentsRepository>(ComponentDeploymentsRepository)
        componentUndeploymentsRepository = module.get<ComponentUndeploymentsRepository>(ComponentUndeploymentsRepository)
        moduleUndeploymentsRepository = module.get<Repository<ModuleUndeploymentEntity>>('ModuleUndeploymentEntityRepository')
        deploymentsRepository = module.get<Repository<DeploymentEntity>>('DeploymentEntityRepository')
        undeploymentsRepository = module.get<Repository<UndeploymentEntity>>('UndeploymentEntityRepository')
        moduleDeploymentsRepository = module.get<Repository<ModuleDeploymentEntity>>('ModuleDeploymentEntityRepository')

        circle = new CircleDeploymentEntity('dummy-circle')

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

        moduleDeployment = new ModuleDeploymentEntity(
            'dummy-id',
            'helm-repository',
            null
        )
        moduleDeployment.deployment = deployment

        componentDeployment = new ComponentDeploymentEntity(
            'dummy-id',
            'dummy-name',
            'dummy-img-url',
            'dummy-img-tag',
            'dummy-context-path',
            'dummy-health-check',
            1234
        )
        componentDeployment.moduleDeployment = moduleDeployment

        componentDeploymentsList = [
            new ComponentDeploymentEntity(
                'dummy-id',
                'dummy-name',
                'dummy-img-url',
                'dummy-img-tag',
                'dummy-context-path',
                'dummy-health-check',
                1234
            ),
            new ComponentDeploymentEntity(
                'dummy-id',
                'dummy-name',
                'dummy-img-url',
                'dummy-img-tag',
                'dummy-context-path',
                'dummy-health-check',
                1234
            )
        ]

        moduleDeploymentWithRelations = new ModuleDeploymentEntity(
            'dummy-id',
            'helm-repository',
            componentDeploymentsList
        )

        moduleDeploymentsList = [
            moduleDeploymentWithRelations
        ]

        deploymentWithRelations = new DeploymentEntity(
            'dummy-deployment-id',
            'dummy-application-name',
            moduleDeploymentsList,
            'dummy-author-id',
            'dummy-description',
            'dummy-callback-url',
            circle,
            false,
            'dummy-circle-id'
        )

        undeployment = new UndeploymentEntity(
            'dummy-author-id',
            deploymentWithRelations,
            'dummy-circle-id'
        )

        moduleUndeployment = new ModuleUndeploymentEntity(
            null,
            null
        )
        moduleUndeployment.undeployment = undeployment

        componentUndeployment = new ComponentUndeploymentEntity(
            null
        )
        componentUndeployment.moduleUndeployment = moduleUndeployment

        componentUndeploymentsList = [
            componentUndeployment,
            componentUndeployment
        ]

        moduleUndeploymentWithRelations = new ModuleUndeploymentEntity(
            null,
            componentUndeploymentsList
        )
    })

    describe('setComponentDeploymentStatusAsFinished', () => {
        it('should correctly update component deployment status to FINISHED', async () => {

            jest.spyOn(componentDeploymentsRepository, 'getOneWithRelations')
                .mockImplementation(() => Promise.resolve(componentDeployment))
            jest.spyOn(moduleDeploymentsRepository, 'findOne')
                .mockImplementation(() => Promise.resolve(moduleDeploymentWithRelations))
            jest.spyOn(deploymentsRepository, 'findOne')
                .mockImplementation(() => Promise.resolve(deploymentWithRelations))

            const queueSpy = jest.spyOn(componentDeploymentsRepository, 'update')
            await statusManagementService.setComponentDeploymentStatusAsFinished(
                'dummy-component-deployment-id'
            )

            expect(queueSpy).toHaveBeenCalledWith({ id: 'dummy-component-deployment-id' }, { status: DeploymentStatusEnum.FINISHED })
        })
    })

    describe('setComponentDeploymentStatusAsFailed', () => {
        it('should correctly update component deployment status to FAILED', async () => {

            jest.spyOn(componentDeploymentsRepository, 'getOneWithRelations')
                .mockImplementation(() => Promise.resolve(componentDeployment))
            jest.spyOn(moduleDeploymentsRepository, 'findOne')
                .mockImplementation(() => Promise.resolve(moduleDeploymentWithRelations))
            jest.spyOn(deploymentsRepository, 'findOne')
                .mockImplementation(() => Promise.resolve(deploymentWithRelations))

            const queueSpy = jest.spyOn(componentDeploymentsRepository, 'update')
            await statusManagementService.setComponentDeploymentStatusAsFailed(
                'dummy-component-deployment-id'
            )

            expect(queueSpy).toHaveBeenCalledWith({ id: 'dummy-component-deployment-id' }, { status: DeploymentStatusEnum.FAILED })
        })
    })

    describe('setComponentUndeploymentStatusAsFinished', () => {
        it('should correctly update component undeployment status to FINISHED', async () => {

            jest.spyOn(componentUndeploymentsRepository, 'getOneWithRelations')
                .mockImplementation(() => Promise.resolve(componentUndeployment))
            jest.spyOn(moduleUndeploymentsRepository, 'findOne')
                .mockImplementation(() => Promise.resolve(moduleUndeploymentWithRelations))
            jest.spyOn(undeploymentsRepository, 'findOne')
                .mockImplementation(() => Promise.resolve(undeployment))

            const queueSpy = jest.spyOn(componentUndeploymentsRepository, 'update')
            await statusManagementService.setComponentUndeploymentStatusAsFinished(
                'dummy-component-undeployment-id'
            )

            expect(queueSpy).toHaveBeenCalledWith({ id: 'dummy-component-undeployment-id' }, { status: UndeploymentStatusEnum.FINISHED })
        })
    })

    describe('setComponentUndeploymentStatusAsFailed', () => {
        it('should correctly update component undeployment status to FAILED', async () => {

            jest.spyOn(componentUndeploymentsRepository, 'getOneWithRelations')
                .mockImplementation(() => Promise.resolve(componentUndeployment))
            jest.spyOn(moduleUndeploymentsRepository, 'findOne')
                .mockImplementation(() => Promise.resolve(moduleUndeploymentWithRelations))
            jest.spyOn(undeploymentsRepository, 'findOne')
                .mockImplementation(() => Promise.resolve(undeployment))

            const queueSpy = jest.spyOn(componentUndeploymentsRepository, 'update')
            await statusManagementService.setComponentUndeploymentStatusAsFailed(
                'dummy-component-undeployment-id'
            )

            expect(queueSpy).toHaveBeenCalledWith({ id: 'dummy-component-undeployment-id' }, { status: UndeploymentStatusEnum.FAILED })
        })
    })
})