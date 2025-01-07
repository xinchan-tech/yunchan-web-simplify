import request from '@/utils/request';

type getGroupChannelsParams = {
    type: '0' | '1' | '2' | '3',
    keywords?: string,
    page?: string,
    'order[price]'? : 'ASC' | 'DESC'
}

export type GroupChannelItem = {
	id: string;
	account: string;
	avatar: string;
	name: string;
	price: string;
	brief: string;
	tags: string;
	total_user: string;
	in_channel: number;
}

type GroupChannelsResult = PageResult<GroupChannelItem>

export const getGroupChannels = async (params: getGroupChannelsParams) => {
    const r = await request.get<GroupChannelsResult>('/channels', {params}).then(r => r.data);
    return r;
}

getGroupChannels.cacheKey = 'groupChannels:channels'


export const syncRecentConversation = async (params) => {
	const r = await request.post('/conversations/sync', params).then(r => r.data);
	return r;
}

syncRecentConversation.cacheKey = 'groupChannels:sync'