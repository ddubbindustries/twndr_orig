var viewUtil = { 
	getUrlVars: function() {
		var input = window.location.search, out = {}, hash, 
			hashes = input.slice(1).split('&');
		for (i in hashes) {
		  hash = hashes[i].split('=');
		  out[hash[0]] = hash[1];
		}
		return out;
	},
	flushLocalStorage: function() {
		for (k in localStorage) {
			localStorage.removeItem(k);
		}
	}
};

var hook = {
	init: function(){
		params = viewUtil.getUrlVars();
		for (k in params) {
			if (cfg_match = k.matchp(/^cfg_(.+)/)) {
				cfg[cfg_match] = params[k];
			} else {
				cfg.params[k] = params[k];
			}
		}
		if (params.max_id && params.since_id) cfg.pages = 20; // will use as many pages as needed to return between ids
		if (params.max_id || cfg.useLocalStore) cfg.liveMode = false;
	},
	start: function() {
		$tweetlist = $('#tweets').empty();
		$tweets = $tweetlist.children('li');
		$meta = $('#meta').empty();
		$stats = $('#stats').empty();
		console.time('total');
	},
	processBefore : function() {
		console.time('process');
	},
	processDuring: function(tweet) {
		//var formatTweet = function(tweet) {return '<li id='+tweet.id+'>'+tweet.text+'</li>';}; 
		var $noob = $(formatTweet(tweet)).addClass('new').data(tweet).click(function(){
				console.log($(this).data());
			});
		if (tweet.id < $tweets.eq(0).attr('id')) {
			$noob.appendTo($tweetlist);
		} else {
			$noob.prependTo($tweetlist);
		}
		$tweets = $tweetlist.children('li');
	},
	processAfter: function(words) {
		
		var out = '<li id="all">[all]</li>', i = 0, max = (cfg.displayWordCount > words.list.length ? words.list.length : cfg.displayWordCount),
			buildSubs = function(k,v){subwords += '<li><span class="word">'+k+'</span><span class="number">'+v+'</span></li>'};
		
		while (i < max) {
			subwords = '';

			$.each(words.list[i].alt, buildSubs);
	
			// build convenience string for future filter event
			words.list[i].tweetIds = '#' + words.list[i].tweetData.map(function(a){return a.id}).join(',#');

			out += '<li id="'+i+'"><div class="hbar" style="width:'+Math.round(words.list[i].count / words.list[0].count * 100)+'%;">'+
				'<span class="word">'+words.list[i].getBestWord()+'</span>'+
				'<span class="number">'+words.list[i].count+'</span>'+
				'<ul class="subwords">' + subwords + '</ul></div></li>';
			i++;
		}
		$stats.html(out);
			
		console.timeEnd('process');
		
		// draw meta
		var out = '', stats = {
			'Controls': '<button id="stop">stop</button><button id="reload">reload</button><button id="flush">flush</button><button id="consolidate">consolidate</button>',
			'Tweets Total / Batches / Last Batch': [words.tweetCount, words.currentPage, words.lastBatch.results.length].join(' / '),
			'Words Raw / Relevant / Quota': [words.rawCount, words.list.length, words.cfg.quotaWordCount].join(' / '),
			'Twip': words.comboTweet(),
			'Permalink': '<a href="$">$</a>'.replace(/\$/g, words.getPermalink(true))
		};
		$.each(stats, function(key,stat) {
			out += '<div><span class="key">' + key + ':</span> <span class="value">' + stat + '</span></div>';
		});
		$meta.html(out);
	
		// bind events
		$('#stop').click(function(){ window.clearTimeout(refresh); });
		
		$('#reload, h1 img').click(function(){ location.reload(); });

		$('#flush').click(viewUtil.flushLocalStorage());

		$('#consolidate').click(function(){
			words.consolidate();
			$('.subwords').show();
		});

		$('.stats > li').mouseenter(words.list, function(e) {
			$('.hover').removeClass();
			$(this).addClass('hover');
			
			if (this.id == 'all') {
				$('.filtered').removeClass('filtered');
				return $tweets.show();
			} else {
				var tweetIds = e.data[this.id].tweetIds;
				$tweets.removeClass('new').parent().addClass('filtered');
				$tweets.not(tweetIds).hide();
				$tweets.filter(tweetIds).show();
			}
		}).click(function(){
			console.log(words.list[$(this).attr('id')]);
			$(this).find('.subwords').toggle();
		});
	},
	consolidate: function(words){
		console.timeEnd('total');
	},
	finalize: function(words) {
		$('#'+words.newestTweet.id).css({border:'solid 3px lightGreen'});
		$('#'+words.oldestTweet.id).css({border:'solid 3px salmon'});
	}
};

$(document).ready(function(){
	go.init(hook);
});
