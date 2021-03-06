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

import { renderHook, act } from '@testing-library/react-hooks';
import { waitFor } from 'unit-test/testUtils';
import { FetchMock } from 'jest-fetch-mock';
import { useCreateUser, useUpdateName } from '../hooks';
import { NewUser, User } from '../interfaces/User';

beforeEach(() => {
  (fetch as FetchMock).resetMocks();
});

jest.mock('core/state/hooks', () => ({
  useDispatch: () => jest.fn()
}));

const payload = {
  id: '123',
  name: 'Charles',
  email: 'charlescd@zup.com.br'
};

const newUser = {
  ...payload,
  id: '123',
};


test('create a new user', async () => {
  (fetch as FetchMock).mockResponseOnce(JSON.stringify(newUser));

  const { result } = renderHook(() => useCreateUser());
  const { current } = result;

  let response: Promise<NewUser>;

  await act(async () => {
    response = await current.create(payload);
  });

  await waitFor(() => expect(response).toMatchObject(newUser));
});

test('error create a new user', async () => {
  const error = {
    name: 'name',
    message: 'The email charles@zup.com.br has already been register.'
  };

  (fetch as FetchMock).mockRejectedValue(new Response(JSON.stringify(error)));

  const { result: userResult } = renderHook(() => useCreateUser());

  let response: Promise<NewUser>;
  await act(async () => {
    response = await userResult.current.create(payload);
  });

  await waitFor(() => expect(response).toBeUndefined());
});


test('useUpdateName hook trigger promise success', async () => {
  (fetch as FetchMock).mockResponseOnce(JSON.stringify(newUser));
  const { result } = renderHook(() => useUpdateName());

  await act(async () => result.current.updateNameById(newUser.id, newUser.name));

  expect(result.current.status).toEqual('resolved');
});

test('useUpdateName hook trigger promise error', async () => {
  (fetch as FetchMock).mockRejectedValue(new Response(JSON.stringify({})));

  const { result } = renderHook(() => useUpdateName());

  await act(async () => result.current.updateNameById(newUser.id, newUser.name));

  expect(result.current.status).toEqual('rejected');
});
