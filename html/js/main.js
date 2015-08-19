var queryTimeout = undefined;
var doQuery;
var deck = [];
var sources = {};
var list = {};

$(document).ready(function() {
	var socket = io();

	var charts = {
		options: {
			segmentStrokeWidth: 4,
			animationEasing: "easeOutCubic"
		},
		normalCopies: {
			ctx: $('#nc').get(0).getContext("2d")
		},
		rareCopies: {
			ctx: $('#rc').get(0).getContext("2d")
		},
		totalCopies: {
			ctx: $('#t').get(0).getContext("2d")
		}
	};

	socket.on('cards-res', function(data) {
		console.log(data);
		for (var d in data) {
			var index = data[d][1];
			var source = data[d][0];
			var rarity = data[d][2];

			if (data[d][0] == -1) {
				deck[index].source = false;
			} else {
				deck[index].source = source;
				deck[index].rarity = rarity;

				if (!sources.hasOwnProperty(source)) {
					sources[source] = {total:1,totalCopies:0,normals:0,normalCopies:0,rares:0,rareCopies:0};
					sources[source].totalCopies += deck[index].count;
				} else {
					sources[source].total++;
					sources[source].totalCopies += deck[index].count;
				}
				if (rarity == 'C') {
					sources[source].normals++;
					sources[source].normalCopies += deck[index].count;
				} else {
					sources[source].rares++;
					sources[source].rareCopies += deck[index].count;
				}
			}
		}

		updateCharts();
		updateList();
	});

	function updateList() {
		list = {};
		var temp = deck.slice();

		temp.sort(function(a, b) {
			return a.source.toString().localeCompare(b.source.toString());
		});

		for (var d in temp) {
			if (!list[temp[d].source]) list[temp[d].source] = [];
			var rarity = temp[d].rarity == 'R' ? '  ' + 'RARE' : '';
			list[temp[d].source].push(temp[d].count + 'x ' + temp[d].name + rarity + '\r\n');
		}

		$('#deck').val(print(list));
		textAreaAdjust($('#deck'), false);

		function print(obj) {
			if (obj['false']) {
				obj['zzz'] = obj['false'];
				delete obj['false'];
			}

			var str = "";
			for (var e in obj) {
				e == 'zzz' ? str += '\r\n' + 'Not Found' + '\r\n' : str += '\r\n' + e + '\r\n';
				for (c in obj[e]) {
					str += obj[e][c];
				}
			}
			return str.trim();
		}
	}

	function updateCharts() {
		var datas = {
			normalCopies: [],
			rareCopies: [],
			totalCopies: []
		};
		var color = "#F7464A";
		var highlight = "#FF5A5E";

		for (var s in sources) {
			datas.normalCopies.push({
				value: sources[s].normalCopies,
				label: s,
				color: color,
				highlight: highlight
			});

			datas.rareCopies.push({
				value: sources[s].rareCopies,
				label: s,
				color: color,
				highlight: highlight
			});

			datas.totalCopies.push({
				value: sources[s].totalCopies,
				label: s,
				color: color,
				highlight: highlight
			});
		}

		datas.normalCopies.sort(function(a, b) {return a.value - b.value});
		datas.rareCopies.sort(function(a, b) {return a.value - b.value});
		datas.totalCopies.sort(function(a, b) {return a.value - b.value});
		if ('chart' in charts.normalCopies) {
			charts.normalCopies.chart.update(datas.normalCopies);
			charts.rareCopies.chart.update(datas.rareCopies);
			charts.totalCopies.chart.update(datas.totalCopies);
		} else {
			charts.normalCopies.chart = new Chart(charts.normalCopies.ctx).Doughnut(datas.normalCopies, charts.options);
			charts.rareCopies.chart = new Chart(charts.rareCopies.ctx).Doughnut(datas.rareCopies, charts.options);
			charts.totalCopies.chart = new Chart(charts.totalCopies.ctx).Doughnut(datas.totalCopies, charts.options);
		}
		$('.pie').animate({opacity:1});
	}


	doQuery = function() {
		var data = $('#deck').val().split(/\r\n|\r|\n/g);
		var tempDeck = sanitize(data);

		socket.emit('cards-req', shrink(tempDeck));

		function shrink(data) {
			var temp = []
			for (var i in data) {temp.push([data[i].name,data[i].id])}
			return temp;
		}

		function sanitize(data) {
			var forbidden = ['spells', 'synchro', '', 'monsters', 'traps', 'main deck', 'side deck', 'cards)'];

			if (typeof data !== 'object' || !data) return;
			for (var d=0; d < data.length; d++) {
				var obj = {};

				if (!checkForbidden(data[d])) {
					var name = data[d].replace(/\d+x\s/g, '');

					//check if we already have the card cached
					var br = false;
					for (var a in deck) {
						if (deck[a].name == name) {
							data.splice(d,1);
							d--;
							br = true;
							break;
						}
					}
					if (br) continue;

					obj.name = name;
					obj.count = /^\d+/g.exec(data[d]);
					obj.id = deck.length;
					if (obj.count) obj.count = parseInt(obj.count[0]);
					else {
						data.splice(d,1);
						d--;
						continue;
					}
					data[d] = obj;
					deck.push(obj)
				} else {
					data.splice(d,1);
					d--;
				}
			}

			return data;

			function checkForbidden(d) {
				for (var f in forbidden) {
					if (d.toLowerCase() == forbidden[f]) return true;
				}
				//if (!d.match('/^[[:alnum:]]/d') || !d.match(/[1-3]+x/d)) return true;

				return false;
			}
		}
	}

	$('#go').click(function() {
		doQuery();
	});
});

function textAreaAdjust(o, canQuery) {
	if (typeof canQuery === 'undefined') canQuery = true;
    $(o).css('height',25+o.scrollHeight);

	/*clearInterval(queryTimeout);
	if (canQuery) {
	    queryTimeout = setTimeout(function(){
	    	doQuery();
	    	clearTimeout(queryTimeout);
	    	queryTimeout = undefined;
	    },2000);
	}*/
}