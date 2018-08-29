(function($) {
  
		function formatDate(date) {
			var d = new Date(date),
				month = '' + (d.getMonth() + 1),
				day = '' + d.getDate(),
				year = d.getFullYear();

			if (month.length < 2) month = '0' + month;
			if (day.length < 2) day = '0' + day;

			return [year, month, day].join('');
		}

		$( "#datepicker" ).datepicker({
			dateFormat: "MM d, yy",
			yearRange: '2018:2018',
			defaultDate: new Date('2018-06-02'),
			minDate: new Date('2018-06-02'),
			maxDate: new Date('2018-06-31')
		});

		$("#datepicker").on("change",function(e){
			e.preventDefault();
			var selected = $(this).val();
			selected = formatDate(selected);
			$.get('data/map/ref_'+selected+'.csv', function(data){
				// show map
				document.getElementById('map').innerHTML="<div id='tweets-map'></div>";
				getLocation(prepareData(data));
			});

			document.getElementById('wordclouddiv').innerHTML="<div id='cloud-chart'></div>";
			getRefugeesRelatedWords('data/wordcloud/ref_'+selected+'.json');

			document.getElementById('topicsdiv').innerHTML=" <svg id='svgtopics'  width='1060' height='450'></svg>";
			getTopicsGraph('data/topics/ref_'+selected+'.json');

			document.getElementById('ego').innerHTML=" <svg id='svgego' width='1060' height='700' style='background-color:white'></svg>";
			getEgo2('data/ego/ref_'+selected+'.json');

		});

		function getRefugeesRelatedWords(wordsfile){

			$.get(wordsfile, function(wordsdata){
				newwordsdata = [];
				for (var i = wordsdata.length - 1; i >= 0; i--) {
					n = wordsdata[i].name;
					if(n=='camps' || n=='agency'||n=='crisis'|| n=='camp'){
						continue;
					}
					newwordsdata.push( {"name":n,"weight":wordsdata[i].weight});
				}

				c1 = createCloud(newwordsdata);

			});

		}

		$(document).ready(function(){

			def = 'ref_20180601.json';

			// read tweets
			$.get('data/map/ref_20180601.csv', function(data){

				// show map
				map = getLocation(prepareData(data));
				getRefugeesRelatedWords('data/wordcloud/'+def);
				getTopicsGraph('data/topics/'+def);
				getEgo2('data/ego/'+def);
				//cloud= getRefugeesRelatedWords()
				// word cloud 1
				//c1 = createCloud(cloud)
				//p1 = createPieChart(locations)
			});
		});


		$("body").on('click', ".leaflet-interactive", function() {

			$(".prevbtn").hide();

			// eanbling next and previous buttons for popups
			$('.nextbtn').click(function(e){
				e.preventDefault();
				$(".prevbtn").show();
				if ($('.active').next('.case').length) {
					$('.active').removeClass('active')
						.next('.case')
						.addClass('active');
				} else{
					$(".nextbtn").hide();
				}
			});
			$('.prevbtn').click(function(e){
				e.preventDefault();
				$(".nextbtn").show();
				if ($('.active').prev('.case').length) {
					$('.active').removeClass('active')
						.prev('.case')
						.addClass('active');
				} else{
					$(".prevbtn").hide();
				}
			});
		});

		$("body").on("click", ".votes", function(e){
			e.preventDefault();
			thisparent = $(this).parent();
			var values = {
				'url': thisparent.attr("data"),
				'vote': $(this).attr("href")
			};

			$.ajax({
				url: "votes_handler.php",
				type: "POST",
				data: values,
				success: function(result){
					thisparent.fadeOut(1000);

				}
			});
		});








  // Smooth scrolling using jQuery easing
  $('a.js-scroll-trigger[href*="#"]:not([href="#"])').click(function() {
    if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
      var target = $(this.hash);
      target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
      if (target.length) {
        $('html, body').animate({
          scrollTop: (target.offset().top - 70)
        }, 1000, "easeInOutExpo");
        return false;
      }
    }
  });

  // Closes responsive menu when a scroll trigger link is clicked
  $('.js-scroll-trigger').click(function() {
    $('.navbar-collapse').collapse('hide');
  });

  // Activate scrollspy to add active class to navbar items on scroll
  $('body').scrollspy({
    target: '#mainNav',
    offset: 100
  });

  // Collapse Navbar
  var navbarCollapse = function() {
    if ($("#mainNav").offset().top > 300) {
      $("#mainNav").addClass("navbar-shrink");
    } else {
      $("#mainNav").removeClass("navbar-shrink");
    }
  };
  // Collapse now if page is not at top
  navbarCollapse();
  // Collapse the navbar when page is scrolled
  $(window).scroll(navbarCollapse);

})(jQuery); // End of use strict






function prepareData(inputData){
	var lines = inputData.split("\n");
	var data = new Array();

	for (var i = 1; i < lines.length; i++) {

		line = lines[i].split(";");

		if(line[0] != ""){
			country = line[2].trim();

			// if country key doesn't exist, create it
			data[country] = data[country] || [];
			data[country].push(line);
		}
	}
	return data;
}

function onClick() {
	$("body").on('DOMSubtreeModified', ".leaflet-popup-pane", function() {
		$("body").find(".case").first().addClass("active");
		$(".info").html($(this).find(".divnews").html());
	});
}
function getLocation(data){
	/*
	plot locations over a map of leaflet
	*/

	mymap = L.map('tweets-map').setView([34.8021, 38.9968], 2);
	L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
		attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
		maxZoom: 28,
		id: 'mapbox.light',
		accessToken: 'pk.eyJ1Ijoic3VhZGFycmEiLCJhIjoiY2plc281Ym9jMGI1cjMycWUwZTVyN2FnZCJ9.7J6drmvv8MHECS8U7oWcNA'
	}).addTo(mymap);

	mymap.scrollWheelZoom.disable();


	allpos=0;allneg=0;allneu=0;

	for (var key in data) {
		pos=0;neg=0;neu=0;
		newarr = data[key];
		lat = newarr[0][3];
		lon = newarr[0][4];

		item = '';

		for (var i = 0; i < newarr.length; i++) {
			row = newarr[i];
			sent = row[0];
			place = row[2].trim();
			sen = row[5];
			sen_word = row[6]
			if(sen_word=='positive'){ pos=pos+1}
			else if(sen_word=='negative'){ neg=neg+1}
			else if(sen_word=='neutral'){ neu=neu+1}
			link = '<a href=\''+row[1]+'\' target=\'_blank\'>'+row[1]+'</a>';

			item += '<div class="case">' +
					'<b>'+place+'</b> - '+sen_word+ ':<span class="sentence">[...] '+sent+'</span>'+link+'<br clear="all">'+
					'<strong data="'+row[1]+'">Is this article <a href="positive" class="votes">Positive</a>, <a href="negative" class="votes">Negative</a>, or <a href="neutral" class="votes">Neutral</a>?</strong>'+
					'</div>';

		}

		item += ' <div class="divnews" style="display:none"><h5>News Distribution</h5>' +
			'<b>Positive: ' + pos+ '</b> '+
			'<b>Negative: ' + neg+ '</b> '+
			'<b>Neutral:  ' + neu+ '</b></div>';

		allpos+=pos;
		allneg+=neg;
		allneu+=neu;

		if(i > 1){
			item += '<a href="#" class="nextbtn float-right"> <i class="fas fa-chevron-right"></i> </a><a href="#" class="prevbtn"> <i class="fas fa-chevron-left"></i> </a><br/>';
		}

		if(neg==0){
			color='blue';
			rad = 200000;

		}
		else{
			color='orange';
			rad = 200000;//(neg+1)*200000;

		}
		// console.log(place,rad)
		L.circle([lat,lon],rad,{'color': color,'stroke':false,'fillOpacity':0.5}).addTo(mymap).on('click', onClick).bindPopup(item);


	}

	var info = L.control();

	info.onAdd = function (map) {
		this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
		this.update();
		return this._div;
	};
	// method that we will use to update the control based on feature properties passed
	info.update = function () {
		this._div.innerHTML = '<h5>News Distribution</h5>' +
			'<b>Positive: <span id="posspan">' + allpos+ '</span></b> '+
			'<b>Negative: <span id="negspan">' + allneg+ '</span></b> '+
			'<b>Neutral:  <span id="neuspan">' + allneu+ '</span></b>'
	};

	info.addTo(mymap);

}

function getTopLocations(locations){
	/*
	return structured array of languages of users.
	*/

	var loccurrences = { };
	for (var i = 0, j = locations.length; i < j; i++) {
		loccurrences[locations[i]] = (loccurrences[locations[i]] || 0) + 1;
	}
	var locdict = []; // create an empty array

	for (var key in loccurrences){
		locdict.push({'name':key,'y':loccurrences[key]})

	}
	return locdict
}


function createCloud(clouddata){
	Highcharts.chart('cloud-chart', {
		series: [{
			type: 'wordcloud',
			data: clouddata,
			name: 'Occurrences',minFontSize:10,
			maxFontSize:40, style: {fontFamily: 'Source Sans Pro'}
		}],
		title: {text: 'Refugees Top Related Words' },
		colors: [ '#F94B4B','#FFD740', '#00638E', '#6A1E74', '#46C66D', '#28C6C6',
			'#7348B3',  '#0068EA','#005151', '#00AEEF','#282828','#DCDCDC']

	});

}




function getTopicsGraph(topicsFile){

	var svg = d3.select("#svgtopics"),
		width = +svg.attr("width"),
		height = +svg.attr("height");

	var color = d3.scaleOrdinal(d3.schemeSet3);

	var simulation = d3.forceSimulation()
		.force("link", d3.forceLink().id(function(d) { return d.id; }))
		.force("charge", d3.forceManyBody().strength([10]).distanceMax([200]))
		.force("center", d3.forceCenter(width / 2, height / 2));

	d3.json(topicsFile, function(error, graph) {
		if (error) throw error;

		var link = svg.append("g")
			.attr("class", "links")
			.selectAll("line")
			.data(graph.links)
			.enter().append("line")
			.attr("stroke-width", function(d) { return Math.sqrt(d.weight); });

		// Linear scale for degree centrality.
		var degreeSize = d3.scaleLinear()
			.domain([d3.min(graph.nodes, function(d) {return d.score; }),d3.max(graph.nodes, function(d) {return d.score; })])
			.range([10,30]);
		simulation.force("collide", d3.forceCollide().radius( function (d) { return degreeSize(d.score)+15; }));

		var node = svg.append("g")
			.attr("class", "nodes")
			.selectAll("g")
			.data(graph.nodes)
			.enter().append("g")
			.attr('r', function(d, i) { return degreeSize(d.score); })

		var circles = node.append("circle")
			.attr('r', function(d, i) { return degreeSize(d.score); })
			.attr("fill", function(d) { return color(d.group); })
			.call(d3.drag()
				.on("start", dragstarted)
				.on("drag", dragged)
				.on("end", dragended));

		var lables = node.append("text")
			.text(function(d) {
				return d.id;
			})


		node.append("title")
			.text(function(d) { return d.score; });

		simulation
			.nodes(graph.nodes)
			.on("tick", ticked);

		simulation.force("link")
			.links(graph.links);
		function ticked() {
			link
				.attr("x1", function(d) { return d.source.x; })
				.attr("y1", function(d) { return d.source.y; })
				.attr("x2", function(d) { return d.target.x; })
				.attr("y2", function(d) { return d.target.y; });

			node
				.attr("transform", function(d) {
					return "translate(" + d.x + "," + d.y + ")";
				})
		}
	});

	function dragstarted(d) {
		if (!d3.event.active) simulation.alphaTarget(0.3).restart();
		d.fx = d.x;
		d.fy = d.y;
	}

	function dragged(d) {
		d.fx = d3.event.x;
		d.fy = d3.event.y;
	}

	function dragended(d) {
		if (!d3.event.active) simulation.alphaTarget(0);
		d.fx = null;
		d.fy = null;
	}
}



function getEgo(filename){


	var tooltip = d3.select("body")
		.append("div")
		.attr("class", "tooltip")
		.style("opacity", 0);

	var svg = d3.select("#svgego"),
		width = +svg.attr("width"),
		height = +svg.attr("height");

	var color = d3.scaleOrdinal(d3.schemeCategory10);

	var simulation = d3.forceSimulation()
		.force("link", d3.forceLink().id(function(d) { return d.id; }).distance(120).strength(1))

		.force("charge", d3.forceManyBody())
		.force("center", d3.forceCenter(width / 2, height / 2));

	d3.json(filename, function(error, graph) {
		if (error) throw error;

		var link = svg.append("g")
			.attr("class", "linksTopics")
			.selectAll("line")
			.data(graph.links)
			.enter().append("line")
			.attr("stroke-width", function(d) {
				return Math.sqrt(d.weight); });

		var node = svg.append("g")
			.attr("class", "nodes")
			.selectAll("g")
			.data(graph.nodes)
			.enter().append("g")

		var circles = node.append("circle")
			.attr('r', function(d, i) { if(d.id=='refugee'){return 20} return d.group*5})
			.attr("fill", function(d) { if (d.id=='refugee'){ return 'red'} return color(d.group); })
			.call(d3.drag()
				.on("start", dragstarted)
				.on("drag", dragged)
				.on("end", dragended));

		var lables = node.append("text")
			.style("font-size", function(d){ if(d.id=='refugee'){return 25} return d.group *4})
			.text(function(d) {
				return d.id;
			})

			.attr('x', 7)
			.attr('y', 3);

		node.append("title")
			.text(function(d) { return d.id; });

		simulation
			.nodes(graph.nodes)
			.on("tick", ticked);

		simulation.force("link")
			.links(graph.links);

		function ticked() {
			link
				.attr("x1", function(d) { return d.source.x; })
				.attr("y1", function(d) { return d.source.y; })
				.attr("x2", function(d) { return d.target.x; })
				.attr("y2", function(d) { return d.target.y; });

			node
				.attr("transform", function(d) {
					return "translate(" + d.x + "," + d.y + ")";
				})
		}
	});

	function dragstarted(d) {
		if (!d3.event.active) simulation.alphaTarget(0.3).restart();
		d.fx = d.x;
		d.fy = d.y;
	}

	function dragged(d) {
		d.fx = d3.event.x;
		d.fy = d3.event.y;
	}

	function dragended(d) {
		if (!d3.event.active) simulation.alphaTarget(0);
		d.fx = null;
		d.fy = null;
	}
}





function getEgo2(filename){
	//reference: https://bl.ocks.org/almsuarez/4333a12d2531d6c1f6f22b74f2c57102

	var tooltip = d3.select("body")
		.append("div")
		.attr("class", "tooltip")
		.style("opacity", 0);


	d3.json(filename, function(error, graph) {
		if (error) throw error;
		const svg = d3.select('#svgego'),
			width = svg.attr('width'),
			height = svg.attr('height');

		const simulation = d3.forceSimulation()
			.nodes(graph.nodes)
			.force('link', d3.forceLink().id(d => d.id).distance(100))
			.force('charge', d3.forceManyBody())
			.force('center', d3.forceCenter(width / 2, height / 2))
			.on('tick', ticked);

		simulation.force('link')
			.links(graph.links);

		const R = 6;




		let link = svg.selectAll('line')
			.data(graph.links)
			.enter().append('line')
			.attr("stroke-width", function(d) {
				return Math.sqrt(d.weight)/2; });

		link
			.attr('class', 'link')

			.on('mouseover.tooltip', function(d) {
				tooltip.transition()
					.duration(300)
					.style("opacity", .8);
				tooltip.html("Source:"+ d.source.id +
					"<p/>Target:" + d.target.id +
					"<p/>Strength:"  + d.weight)
					.style("left", (d3.event.pageX) + "px")
					.style("top", (d3.event.pageY + 10) + "px");
			})
			.on("mouseout.tooltip", function() {
				tooltip.transition()
					.duration(100)
					.style("opacity", 0);
			})
			.on('mouseout.fade', fade(1))
			.on("mousemove", function() {
				tooltip.style("left", (d3.event.pageX) + "px")
					.style("top", (d3.event.pageY + 10) + "px");
			});


		let node = svg.selectAll('.node')
			.data(graph.nodes)
			.enter().append('g')
			.attr('class', 'node')
			.call(d3.drag()
				.on("start", dragstarted)
				.on("drag", dragged)
				.on("end", dragended));;

		node.append('circle')
			.attr('r', function(d, i) { if(d.id=='refugee'){return 20} return d.group*5})
			.attr("fill", function(d) {
				if(d.id=='refugee'){return '#F94B4B'}
				if(d.group==1) {return '#7348B3'}
				if(d.group==2) {return '#28C6C6';}
			})
			.on('mouseover.tooltip', function(d) {
				tooltip.transition()
					.duration(300)
					.style("opacity", .8);
				tooltip.html(d.id)
					.style("left", (d3.event.pageX) + "px")
					.style("top", (d3.event.pageY + 10) + "px");
			})
			.on('mouseover.fade', fade(0.1))
			.on("mouseout.tooltip", function() {
				tooltip.transition()
					.duration(100)
					.style("opacity", 0);
			})
			.on('mouseout.fade', fade(1))
			.on("mousemove", function() {
				tooltip.style("left", (d3.event.pageX) + "px")
					.style("top", (d3.event.pageY + 10) + "px");
			})
			.on('dblclick',releasenode)


		node.append('text')
			.attr('x', 0)
			.attr('dy', '.35em')
			.text(d => d.name);
		var lables = node.append("text")
			.style("font-size", function(d){ if(d.id=='refugee'){return 20} return d.group *12})
			.text(function(d) {
				return d.id;
			})

			.attr('x', 7)
			.attr('y', 3);
		function ticked() {
			link
				.attr('x1', d => d.source.x)
				.attr('y1', d => d.source.y)
				.attr('x2', d => d.target.x)
				.attr('y2', d => d.target.y);

			node
				.attr('transform', d => `translate(${d.x},${d.y})`);
		}

		function dragstarted(d) {
			if (!d3.event.active) simulation.alphaTarget(0.3).restart();
			d.fx = d.x;
			d.fy = d.y;
		}

		function dragged(d) {
			d.fx = d3.event.x;
			d.fy = d3.event.y;
		}

		function dragended(d) {
			if (!d3.event.active) simulation.alphaTarget(0);
			//d.fx = null;
			//d.fy = null;
		}
		function releasenode(d) {
			d.fx = null;
			d.fy = null;
		}

		const linkedByIndex = {};
		graph.links.forEach(d => {
			linkedByIndex[`${d.source.index},${d.target.index}`] = 1;
		});
		function isConnected(a, b) {
			return linkedByIndex[`${a.index},${b.index}`] || linkedByIndex[`${b.index},${a.index}`] || a.index === b.index;
		}

		function fade(opacity) {
			return d => {
				node.style('stroke-opacity', function (o) {
					const thisOpacity = isConnected(d, o) ? 1 : opacity;
					this.setAttribute('fill-opacity', thisOpacity);
					return thisOpacity;
				});

				link.style('stroke-opacity', o => (o.source === d || o.target === d ? 1 : opacity));

			};
		}

	});
}