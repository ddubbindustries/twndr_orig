var tweetr = require('./tweetr'),
	go = require('./../controller'),
	emailr = require('./emailr');

go.init({
	finalize: function(words){
		//tweetr.postTweet(words.comboTweet());
		emailr.send({
			from: 'Twndr <bot@twndr.com>',
			to: 'dave.williams@rackspace.com',
			subject: words.comboTweet(),
			text: '@twndr via Mailgun'
		});
	}
});
