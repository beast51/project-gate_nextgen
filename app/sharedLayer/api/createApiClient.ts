import {
  AccessActorsResponse,
  AccessQuery,
  AccessResponse,
  ActivityActorsResponse,
  ActivityQuery,
  ActivityResponse,
  AddGateUserRequest,
  API_ROUTES,
  CallsResponse,
  DeleteGateUserRequest,
  EditGateUserRequest,
  GateUsersQuery,
  GateUsersResponse,
  PageViewRequest,
  PeriodQuery,
  RegisterRequest,
  UnblockExpiredPenaltiesResponse,
  ViolationsResponse,
} from '@/contracts';

// The only way the front end talks to the back end: HTTP + the types from contracts/.
// The client does not know where it runs. A browser and a server rendering a page differ only
// in the transport they pass in, which is also the only thing to replace when the framework changes.

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export type ApiTransport = {
  fetch: typeof fetch
  // '' in a browser (same origin), an absolute origin on a server
  baseUrl?: string
  // extra headers of every request, a server passes the cookies of the visitor here
  headers?: () => Record<string, string> | Promise<Record<string, string>>
  onUnauthorized?: () => void
}

type Query = Record<string, string | number | boolean | undefined>

const toQueryString = (query: Query = {}) => {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== false) params.set(key, String(value));
  });

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
};

export const createApiClient = ({ fetch: send, baseUrl = '', headers, onUnauthorized }: ApiTransport) => {
  const request = async <Response>(path: string, options: { query?: Query, body?: unknown } = {}): Promise<Response> => {
    const hasBody = options.body !== undefined;

    const response = await send(`${baseUrl}${path}${toQueryString(options.query)}`, {
      method: hasBody ? 'POST' : 'GET',
      headers: {
        ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
        ...(await headers?.()),
      },
      body: hasBody ? JSON.stringify(options.body) : undefined,
      cache: 'no-store',
    });

    if (!response.ok) {
      if (response.status === 401) onUnauthorized?.();

      const details = await response.json().catch(() => null);
      throw new ApiError(response.status, details?.error || `Request to ${path} failed with status ${response.status}`);
    }

    return response.json();
  };

  return {
    getCalls: (period: PeriodQuery) => request<CallsResponse>(API_ROUTES.calls, { query: period }),
    getViolations: (period: PeriodQuery) => request<ViolationsResponse>(API_ROUTES.violations, { query: period }),
    unblockExpiredPenalties: () =>
      request<UnblockExpiredPenaltiesResponse>(API_ROUTES.unblockExpiredPenalties, { body: {} }),

    getGateUsers: (query: GateUsersQuery = {}) => request<GateUsersResponse>(API_ROUTES.gateUsers, { query }),
    addGateUser: (user: AddGateUserRequest) => request<unknown>(API_ROUTES.addGateUser, { body: user }),
    editGateUser: (user: EditGateUserRequest) => request<unknown>(API_ROUTES.editGateUser, { body: user }),
    deleteGateUser: (user: DeleteGateUserRequest) => request<unknown>(API_ROUTES.deleteGateUser, { body: user }),

    getActivity: (query: ActivityQuery = {}) => request<ActivityResponse>(API_ROUTES.activity, { query }),
    getActivityActors: () => request<ActivityActorsResponse>(API_ROUTES.activityActors),

    getAccessLog: (query: AccessQuery = {}) => request<AccessResponse>(API_ROUTES.access, { query }),
    getAccessActors: () => request<AccessActorsResponse>(API_ROUTES.accessActors),
    reportPageView: (view: PageViewRequest) => request<unknown>(API_ROUTES.pageViews, { body: view }),

    register: (account: RegisterRequest) => request<unknown>(API_ROUTES.register, { body: account }),
    deleteFiles: (files: unknown) => request<unknown>(API_ROUTES.deleteFiles, { body: files }),
  };
};

export type ApiClient = ReturnType<typeof createApiClient>
