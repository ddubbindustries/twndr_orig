// server conditional
if (typeof $ == 'undefined') var $ = require('./srvr/node_modules/jquery');
if (typeof cfg == 'undefined') var cfg = require('./cfg').cfg;
if (typeof params == 'undefined') var params = {};

String.prototype.matchp = function(rgx) { return (this.match(rgx) || [,false])[1]; }; // only return inner parens, fallback to false

var util = {
	commonWords: "time know back why like day today rt " + "a able about above across after all almost along already also always am an and any anybody anyone anything anyway anyways anywhere apart are aren't around as ask asking at away be because been before behind being below best better between both but by c'mon came can can't cant clearly come comes could couldn't did didn't do does doesn't doing don't done each either else etc even ever every everybody everyone everything everywhere exactly except far few first followed following follows for from get gets getting given gives go goes going gone got gotten had hadn't happens hardly has hasn't have haven't having he he's her here here's hers herself him himself his how however i i'd i'll i'm i've if in instead into is isn't it it'd it'll it's its itself just keep keeps kept let's many may maybe me might more much my neither no not nothing now of oh ok okay old on once one ones only onto or other others our ours ourselves out over own probably quite really right said same saw say saying says see seeing seem seemed seeming seems seen she should shouldn't since so some somebody somehow someone something sometime sometimes somewhere soon still such sure take taken tell than that that's thats the their theirs them themselves then there there's theres these they they'd they'll they're they've this those though through thru to together too took toward towards tried tries truly try trying twice under unfortunately until up us use used uses using usually very vs was wasn't way we we'd we'll we're we've well went were weren't what what's when where where's whether which while who who's whoever whole whom whose will with within without won't would wouldn't yes yet you you'd you'll you're you've your yours yourself yourselves",
	punctRgx: /\W\-\W|\-\-|:\s|[\s\!\.\?;"~,\(\)]+/g,
	isInString: function(needle, haystack) {
		return (' '+haystack+' ').indexOf(' '+needle+' ') > -1;
	},
	isRelevant: function(input) {
		return !(input.length < 2 || util.isInString(input.toLowerCase(), util.commonWords));
	},
	filterRelevant: function(input) {
		return input.filter(function(a){return util.isRelevant(a);});
	},
	removeRT: function(input) {
		return input.replace(/^RT\s\S+\s/,'');
	},
	isInString: function(a,b) {
		return (' '+b+' ').indexOf(' '+a+' ') > -1;
	},
	tokenize: function(input) {	
		return input.toLowerCase().split(util.punctRgx);
	},
	preFilter: function(input) {
		input = util.removeRT(input);
		input = util.replaceMap(input, {'&amp;':'&','&lt;':'<','&gt;':'>'});
		return input.replace(/http.*\b/g,'').replace(util.punctRgx, ' ').trim();
	},
	replaceMap: function(input, map) {
		return input.replace(new RegExp(Object.keys(map).join('|'),'gim'), function(a){return map[a];});
	},
	getAverage: function(arr) {
		var tot = 0;
		$.each(arr, function(){
			tot += this;
		});
		return Math.ceil(tot/arr.length);
	},
	getSubwordCombos: function(input, min, max) {
		var arr = input.trim().split(' '), 
			last = arr.length, 
			min = min || 1,
			max = max || last, 
			out = [], combo = [], new_combo = '';
		
		for (i=0; i < last; i++) {
			for (j=i; j < last; j++) {
				combo = arr.slice(i, j+1);
				new_combo = combo.join(' ');
				if (combo.length <= max && combo.length >= min && new_combo !== input) out.push(new_combo);
			}
		}
		return out;
	},
	uniq: function(arr) {
		return arr.filter(function(el,i,a){return i==a.indexOf(el)});
	}
};

var words = {
	cfg: cfg,
	currentPage: 0,
	getTpmAverage: function() {
		var look = Math.ceil(cfg.tpmLookback / cfg.refreshRate);
		return words.tpmHistory.length > look ? '~' + util.getAverage(words.tpmHistory.slice(-look)) + 'tpm' : '';
	},
	init: function() {
		words.list = [];
		words.rawCount = 0;
		words.lastBatch = {};
		words.tpmHistory = [];
		words.tweetCount = 0;
		words.oldestTweet = {};
		words.newestTweet = {};
		words.retweets = [];
		console.log("initializing:", JSON.stringify(cfg));
		return true;
	},
	processItem: function(tweet) {
		var chunks = util.getSubwordCombos(util.preFilter(tweet.text), 1, cfg.memeMaxWordCount),
			chunklets = [];
		$.each(chunks, function(i, chunk){
			chunklets = chunk.split(' ');
			if (util.filterRelevant(chunklets).length / chunklets.length >= 0.5) words.postTally(chunk, tweet);
		});
	},
	postTally: function(new_word, tweet) {
		var alt = {}, new_word_lower = new_word.toLowerCase();
			alt[new_word] = 1;
		
		for (var i=0, ii=words.list.length; i < ii; i++) {
			if (new_word_lower == words.list[i].word && words.uniqueToUser(tweet.from_user_id,i)) {
				words.list[i].count += 1;
				words.list[i].alt[new_word] = words.list[i].alt[new_word] ? words.list[i].alt[new_word] + 1 : 1;
				words.list[i].tweetIds += ',#' + tweet.id;
				words.list[i].tweetData.push({
					id: tweet.id,
					user: tweet.from_user_id,
					timestamp: tweet.created_at
				});
				return words.sortTally(i);
			}
		}

		return words.list.push({
			word: new_word_lower,
			alt: alt,
			getBestWord: function(){
				var maxKey = '', maxVal = 0;
				$.each(this.alt, function(k,v){ 
					if (v > maxVal) {
						maxKey = k; 
						maxVal = v;
					} 
				});
				return maxKey;
			},
			count: 1,
			tweetIds: '#' + tweet.id,
			tweetData: [{
				id: tweet.id,
				user: tweet.from_user_id,
				timestamp: tweet.created_at
			}]
		});
	},
	uniqueToUser: function(user_id, i) {
		for (var k=0; k < words.list[i].tweetData.length; k++) {
			if (words.list[i].tweetData[k].user == user_id) return false;
		}
		return true;
	},
	sortTally: function(a) {
		while (a > 0 && words.list[a].count > words.list[a-1].count) {
			var temp = words.list[a-1];
			words.list[a-1] = words.list[a];
			words.list[a] = temp;
			a--;
		}
		return a;
	},
	getIndexArr: function() {
		return words.list.map(function(a){return a.word;});
	},
	sortBySubwordCount: function(){
		return words.list.sort(function(a,b){return b.word.split(' ').length - a.word.split(' ').length;});
	},
	sortByCount: function() {
		return words.list.sort(function(a,b){return b.count - a.count});
	},
	consolidate: function() {
		tempWordArr = words.getIndexArr().slice(0, cfg.displayWordCount)
		var subwords = [], index = -1, hashtag = '';
		
		$.each(words.list.slice(0, cfg.displayWordCount), function(i, word) {

			if (!word.count) return;

			//words.joinSubwords(index, word);
			words.joinSimilar(tempWordArr.indexOf('#' + word.word), word, i);
			words.joinSimilar(tempWordArr.indexOf(word.word + 's'), word, i);
			words.joinSimilar(tempWordArr.indexOf(word.word + 'es'), word, i);
			//words.joinSimilar(tempWordArr.indexOf(word.word.replace(/'/, '')), word, i);

		});

		words.sortByCount();

		go.hook.consolidate(words);
		
		go.hook.processAfter(words);

		return words;
	},
	joinSubwords: function(index, word) {
		$.each(util.getSubwordCombos(word.word, word.word.split(' ').length-1), function(j, subword){
			index = tempWordArr.indexOf(subword);
			if (index > -1) {
				console.log('decremented', subword);
				words.list[index].count = words.list[index].count - word.count;
				if (words.list[index]) words.list[index].alt['&laquo; '+word.word] = -word.count;
				words.list[tempWordArr.indexOf(word.word)].alt['&raquo; '+subword] = words.list[index].count;
			}
		});
	},
	joinSimilar: function(index, word, i){
		if (index == -1 || !words.list[index]) return false;
		console.log('consolidated', words.list[index].word, 'and', word.word);
		words.list[index].count += word.count;
		words.list[index].tweetData.concat(word.tweetData);
		words.list[index].tweetIds += ',' + word.tweetIds;
		words.list[index].alt[word.word] = word.count;
		words.list[i].count = 0;
	},
	comboTweet: function() {
		var out = '', spacer = ' ', tweetMax = 140, meta = words.getTpmAverage();// + ' ' + words.getPermalink();
		for(i=0; i < words.list.length; i++) {
			var nextWord = util.replaceMap(words.list[i].getBestWord(), {'@':''});
			if (out.length + spacer.length + nextWord.length > tweetMax - meta.length) return (out + meta).trim();
			out += nextWord + spacer;
		}
	},
	getPermalink: function(full){
		var out = 'http://twndr.com/?since_id=' + words.oldestTweet.id + '&max_id=' + words.newestTweet.id;
		return full ? out : out.slice(0,17) + '...';
	}
};

var go = {
	init: function(hook) {
		go.hook = go.setHooks(hook || {});
		go.hook.init();
		go.start('?'+$.param(cfg.params));
	},
	setHooks: function(hook) {
		$.each(['init','start','processBefore','processDuring','processAfter','consolidate','finalize'],function(){
			hook[this] = hook[this] || function(){return false;};
		});
		return hook;
	},
	start: function(path) {
		words.init();
		go.getAPI(path);
		go.hook.start();
	},
	getAPI: function(path) { 
		if (cfg.useLocalStore && localStorage.getItem(path)) {
			
			var cachedData = JSON.parse(localStorage.getItem(path));
			console.log('from cache:', path);
			setTimeout(go.handler, 0, cachedData); // not sure why callback is needed

		} else {

			query = cfg.url + path;
			$.ajax({
				url : query,
				dataType: 'jsonp',
				success: function(data) {
					console.log('from api:', path);
					if (cfg.useLocalStore) localStorage.setItem(path, JSON.stringify(data));
					go.handler(data);
				}
			});
		
		}
	},
	handler: function(data) {
		words.currentPage++;		
		if (typeof data.results == 'undefined') return go.finalize({msg:'results undefined'});

		data.results.reverse();

		go.processBatchMeta(data);
		
		if (words.list.length > cfg.quotaWordCount) return go.finalize({restart: cfg.liveMode, msg:'exeeded word count'});
		
		if (words.currentPage < cfg.pages) {
			if (data.next_page) {
				go.getAPI(data.next_page + (cfg.params.since_id ? '&since_id='+cfg.params.since_id : ''));
				return go.processBatch(data);
			} else {
				go.processBatch(data);
				return go.finalize({restart:true, msg: 'no next_page'});
			}
		} else if (cfg.liveMode && data.refresh_url) {
			refresh = setTimeout(function(){
				words.tpmHistory.push(data.results.length / cfg.refreshRate);
				go.getAPI(data.refresh_url);
			}, cfg.refreshRate * 60 * 1000);
			return go.processBatch(data);
		}

		go.processBatch(data);
	},
	processBatchMeta: function(data){
		words.lastBatch = data;
		var lastBatchCount = words.lastBatch.results.length; 
		words.tweetCount += lastBatchCount;
		if (lastBatchCount) {
			if (typeof words.oldestTweet.id == 'undefined' || words.lastBatch.results.slice(-1)[0].id < words.oldestTweet.id) words.oldestTweet = words.lastBatch.results.slice(-1)[0];
			words.newestTweet = words.lastBatch.results[0];
		}
	},
	processBatch: function(data) {
		go.hook.processBefore(words);	
		
		$.each(data.results, function(i,tweet) {
			if (util.isInString(tweet.from_user_id, cfg.excludeUsers)) return true;

			go.hook.processDuring(tweet);
			
			if (words.retweets.indexOf(util.removeRT(tweet.text)) == -1) { // process if not on retweet list
				words.processItem(tweet);
				if (tweet.text.indexOf('RT') == 0) words.retweets.push(util.removeRT(tweet.text)); // but if this is a RT add to list for next time
			}
		});

		go.hook.processAfter(words);
		
		words.consolidate();	
		
		console.log(new Date().toISOString(), 'tweets:', words.tweetCount, 'words:', words.list.length + '/' + words.cfg.quotaWordCount, 'twip:', words.comboTweet());
	},
	finalize: function(opt){
		go.hook.finalize(words);
		
		if (opt.restart) {
			return go.start(words.lastBatch.refresh_url);
		} else {
			if (typeof refresh !== 'undefined') clearTimeout(refresh);
		}
	}
};

// server conditional
if (typeof exports !== 'undefined') exports.init = go.init;

