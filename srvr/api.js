var cfg = require('./../cfg').cfg,
	go = require('./../controller'),
	http = require('http'),
    url = require('url'),
    path = require('path');

go.init({
	init: function(){
		cfg.pages = 1;
		cfg.params.rpp = 5;
	},
	processAfter: function(words){
		out = words.list;
	}
});

http.createServer(function(req, res) {
	var params = url.parse(req.url, true).query,
		timer = new Date().getTime();

	res.writeHead(200, {
		"Content-Type": "text/javascript"
		//'Cache-Control': 'public, max-age=3600',
		//'Expires': new Date(new Date().getTime()+24*3600)
	});
	
	out.response = (new Date().getTime() - timer) + 'ms';
	out = JSON.stringify(out);

	res.end(params.callback ? params.callback + '(' + out + ');' : out);
	console.log(Date(), req.url, req.headers['user-agent']);
	console.log('out:', out);

}).listen(8081);

console.log('srvr up');

