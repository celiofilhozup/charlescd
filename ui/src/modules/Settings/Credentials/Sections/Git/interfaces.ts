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

export interface Credentials {
  address: string;
  accessToken: string;
  serviceProvider: string;
}

export interface GitFormData {
  name?: string;
  credentials?: Credentials;
}

export interface Response {
  id: string;
  git?: GitFormData;
}

export interface PostResponse {
  id: string;
  name: string;
}

export type TestConnectionSuccess = {
  status: string;
};

export type TestConnectionError = {
  code: string;
  message: string;
};

export type TestConnectionResponse =
  | TestConnectionSuccess
  | TestConnectionError;
