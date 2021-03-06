/*
 * Copyright 2020 ZUP IT SERVICOS EM TECNOLOGIA E INOVACAO SA
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { memo, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import isEmpty from 'lodash/isEmpty';
import Button from 'core/components/Button';
import routes from 'core/constants/routes';
import Text from 'core/components/Text';
import Layer from 'core/components/Layer';
import CircleMetrics from 'containers/Metrics/Chart';
import ContentIcon from 'core/components/ContentIcon';
import { useGlobalState } from 'core/state/hooks';
import { METRICS_TYPE, CHART_TYPE } from 'containers/Metrics/Chart/enums';
import {
  getActiveMetric,
  ChangeType,
  getActiveMetricDescription
} from '../helpers';
import Styled from '../styled';
import { useDatasource } from 'modules/Settings/Credentials/Sections/MetricProvider/hooks';
import { some } from 'lodash';
import { Datasource } from 'modules/Settings/Credentials/Sections/MetricProvider/interfaces';

interface Props {
  id: string;
}

const LayerMetrics = ({ id }: Props) => {
  const { item: response, status } = useGlobalState(
    ({ workspaces }) => workspaces
  );
  const history = useHistory();
  const { responseAll, getAll } = useDatasource();

  const [activeMetricType, setActiveMetricType] = useState(
    METRICS_TYPE.REQUESTS_BY_CIRCLE
  );

  useEffect(() => {
    getAll()
  }, [getAll])

  const handleChangeMetricTypes = (changeType: ChangeType) => {
    const activeMetric = getActiveMetric(changeType, activeMetricType);
    setActiveMetricType(activeMetric);
  };

  const handleAddMetrics = () => {
    history.push(routes.credentials);
  };

  const renderMetricsControl = () => (
    <Styled.MetricsControl>
      <Styled.MetricsLabel>
        <Text.h5 color="light">
          {getActiveMetricDescription(activeMetricType)}
        </Text.h5>
      </Styled.MetricsLabel>
      <Styled.SortLeft onClick={() => handleChangeMetricTypes('INCREASE')} />
      <Styled.SortRight onClick={() => handleChangeMetricTypes('DECREASE')} />
    </Styled.MetricsControl>
  );

  const renderNoMetrics = () => (
    <Button.Rounded
      icon={'add'}
      name={'add'}
      color={'dark'}
      onClick={() => handleAddMetrics()}
    >
      Add datasource health
    </Button.Rounded>
  );

  const renderContent = () => {
    return some((responseAll as Datasource[]), { healthy: true }) ? (
      <CircleMetrics
        id={id}
        metricType={activeMetricType}
        chartType={CHART_TYPE.COMPARISON}
      />
    ) : (
        renderNoMetrics()
      );
  };

  return (
    <Layer data-testid="layer-metrics">
      <Styled.MetricsTitle>
        <ContentIcon icon="activity">
          <Text.h2 color="light">Health</Text.h2>
        </ContentIcon>
        {!isEmpty(response?.metricConfiguration) && renderMetricsControl()}
      </Styled.MetricsTitle>
      {status === 'resolved' && (
        <Styled.Content>{renderContent()}</Styled.Content>
      )}
    </Layer>
  );
};

export default memo(LayerMetrics);
