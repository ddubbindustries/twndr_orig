var cfg = {
	pages:	5,
	refreshRate: 1, 	// minutes
	tpmLookback: 60,	// minutes
	displayWordCount: 100,
	quotaWordCount: 20000,
	memeMaxWordCount: 5,
	useLocalStore: false,
	liveMode: true,
	url : 'http://search.twitter.com/search.json',
	excludeUsers: '815249522', //twndr
	params: {
		q: '',
		rpp	: 100,
		geocode: '37.22,-80.42,5mi',
		lang: 'en',
		result_type: 'recent'
	}
};
