// {{{ Relative time function - by dtw 20090301
function relative_time(post_date, abbr) {
	var	unit = [
			[1000,	'second',		'sec',	's'],
			[60,	'minute',		'min',	'm'],
			[60,	'hour',			'hr',	'h'],
			[24,	'day',			'day',	'd'],
			[7,		'week',			'wk',	'w'],
			[4.33,	'month',		'mon',	'mo'],
			[12,	'year',			'yr',	'y'],
			[10,	'decade',		'dec',	'X'],
			[10,	'century',		'cen',	'C'],
			[10,	'milleninium',	'mil',	'M']
		],
		post_date = new Date(post_date),
		today = new Date(),
		diff = today - post_date,
		text = 'some time',
		i = 0;
		
	while (diff >= unit[i][0] / 1.3) {
		diff = diff / unit[i][0];	
		if (typeof(abbr) == 'undefined') abbr = 1;
		text = unit[i][abbr];
		if (abbr < 3) text = ' ' + text + (diff.toFixed(0) > 1 ? 's' : '');
		text = diff.toFixed(0) + text;
		i++;
	} 
	return text;
}
// }}}

// {{{	Add hyperlinks to twitter feed - by dtw 20090401
function hyperlinks(text) {
	
	// http tags
	text = text.replace(/\s(\w+\.[com|org|net|info])/gi, ' http://$1');
	text = text.replace(/(ftp|http|https|file):\/\/[\S]+(\b|$|\.)/gi, '<a href="$&" target="_blank" class="twitter-url">$&</a>');
	//email tags, these are rare
	text = text.replace(/(\w+@{1}[\w\-]+\.[\w\-]+)/gi, '<a href="mailto:$1" target="_blank" class="twitter-url">$1</a>');
	//twitter user
	text = text.replace(/([\.|\,|\:|\Â¡|\Â¿|\>|\{|\(]?)@{1}(\w+)([\.|\,|\:|\!|\?|\>|\}|\)]?\s|\'s|$)/gi, '$1<a href="http://twitter.com/$2" target="_blank" class="twitter-user">@$2</a>$3');

	return(text);
}
// }}}

// {{{ Get feed - by dtw 20090320
// format for twitter search results
function formatTweet(tweet) {
	var author = tweet.from_user;
	var authorLink = 'http://twitter.com/'+author;
	var content = '<span class="content"><a href="'+authorLink+'" target="_blank">'+author+'</a>: '+hyperlinks(tweet.text)+'</span>';
	var image = '<a href="'+authorLink+'" target="_blank"><img alt="'+author+'" title="'+author+'" src="'+tweet.profile_image_url+'"/></a>';
	return '<li id="'+tweet.id+'">'+image+content+' <span class="timestamp">'+
		'<a href="'+authorLink+'/status/'+tweet.id+'" target="_blank" title="'+tweet.created_at+'">'+relative_time(tweet.created_at)+'</a></span> '+
		(tweet.location !== '' ? '<span class="location">from '+tweet.location+'</span>' : '')+'</li>';	
}
// format for twitter api results
function formatApiTweet(tweet) {	

	if (tweet.retweeted_status !== undefined) {
		tweet.user = tweet.retweeted_status.user;
		tweet.text = tweet.retweeted_status.text;
	}
	
	tweet.profile_image_url = tweet.user.profile_image_url;
	tweet.from_user = tweet.user.screen_name;
	tweet.from_user_id = tweet.user.from_user_id;
	tweet.location = tweet.user.location;
	
	return tweet;
}

// }}}
