import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '@/services/api';

interface Invite {
    id: string;
    code: string;
    server_id: string;
    uses: number;
    max_uses: number | null;
    expires_at: string | null;
    created_at: string;
    creator_name: string;
}

interface InvitesState {
    invites: Record<string, Invite[]>; // Keyed by server ID
    loading: boolean;
    error: string | null;
}

const initialState: InvitesState = {
    invites: {},
    loading: false,
    error: null
};

export const createInvite = createAsyncThunk(
    'invites/create',
    async ({ serverId, maxUses, expiresIn }: {
        serverId: string;
        maxUses?: number;
        expiresIn?: number;
    }) => {
        const response = await api.post(`/servers/${serverId}/invites`, {
            maxUses,
            expiresIn
        });
        return response.data;
    }
);

export const fetchServerInvites = createAsyncThunk(
    'invites/fetchServerInvites',
    async (serverId: string) => {
        const response = await api.get(`/servers/${serverId}/invites`);
        return {
            serverId,
            invites: response.data
        };
    }
);

export const revokeInvite = createAsyncThunk(
    'invites/revoke',
    async ({ serverId, code }: { serverId: string; code: string }) => {
        await api.delete(`/servers/${serverId}/invites/${code}`);
        return { serverId, code };
    }
);

const invitesSlice = createSlice({
    name: 'invites',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(createInvite.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createInvite.fulfilled, (state, action) => {
                state.loading = false;
                const serverId = action.payload.server_id;
                if (!state.invites[serverId]) {
                    state.invites[serverId] = [];
                }
                state.invites[serverId].push(action.payload);
            })
            .addCase(createInvite.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to create invite';
            })
            .addCase(fetchServerInvites.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchServerInvites.fulfilled, (state, action) => {
                state.loading = false;
                state.invites[action.payload.serverId] = action.payload.invites;
            })
            .addCase(fetchServerInvites.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch invites';
            })
            .addCase(revokeInvite.fulfilled, (state, action) => {
                const { serverId, code } = action.payload;
                if (state.invites[serverId]) {
                    state.invites[serverId] = state.invites[serverId].filter(
                        invite => invite.code !== code
                    );
                }
            });
    }
});

export default invitesSlice.reducer;