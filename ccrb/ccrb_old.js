"use strict";

// modules

const regression = require('regression');
const ss = require('simple-statistics');
const D3Node = require('d3-node');
const ccrblib = require('./ccrblib.js');

// finish loading d3
const d3n = new D3Node();
const d3 = d3n.d3;
global.fetch = require('node-fetch');
// start processing data

const elt_year = document.getElementById('year-select');
const elt_cmp_race = document.getElementById('cmp-race-select');
const elt_mos_race = document.getElementById('mos-race-select');

// Margins
const margin = {
    top:20,
    left:20,
    bottom:20,
    right:20
};
const w = window.innerWidth - margin.left - margin.right;
const h = window.innerHeight - margin.top - margin.bottom;

var svg = d3.select('body')
    .append("svg")
    .attr('width', w + margin.left + margin.right)
    .attr('height', h + margin.top + margin.bottom);

var g_of_xy_mult = (xmult, ymult) => {
    return svg.append('g')
	.attr('transform',
	      'translate(' + (margin.left + xmult * w)
	      + ',' + (margin.top + ymult * h) + ')');
};

var g_by_cmp = g_of_xy_mult(0.75, 0.25);
var g_by_mos = g_of_xy_mult(0.75, 0.75);

const load_data = (data) => {
    return ccrblib.get_annual_stats(data);
};

const colors = {
    Black: 'brown',
    Hispanic: 'orange',
    Asian: 'gray',
    White: 'beige',
    'American Indian': 'purple',
    'Other Race': 'pink',
    Unknown: 'green',
    Refused: 'red',
    '': 'blue'
};  

const handle_data = (by_year) => {

    const maxR = Math.min(h, w) / 4;
    let year = elt_year.value;
    let cmp_race = elt_cmp_race.value;
    let mos_race = elt_mos_race.value;
    console.log(year, cmp_race, mos_race);
    var all_pairs = by_year[year];
    var cmp_pairs = all_pairs.filter((p) => { return p.cmp_race === cmp_race });
    var mos_pairs = all_pairs.filter((p) => { return p.mos_race === mos_race });
    var int_pairs = all_pairs.filter((p) => {
	return p.mos_race === mos_race & p.cmp_race === cmp_race
    });
    [{pairs:cmp_pairs,
      field:'pct_complaints_by_cmp_against_mos',
      g:g_by_cmp,
      color:'mos_race'},
     {pairs:mos_pairs,
      field:'pct_complaints_against_mos_by_cmp',
      g:g_by_mos,
      color:'cmp_race'},
    ].forEach((r) => {
	let pairs = r.pairs;
	let g = r.g;
	let field = r.field;
	g.selectAll('path').remove();
	var arc = d3.arc()
	    .innerRadius(0)
	    .outerRadius((d) => {
		return maxR * Math.sqrt(d[field])
	    })
	    .startAngle((d, i) => {return i * 2 * Math.PI / pairs.length})
	    .endAngle((d,i) => {return (i+1) * 2 * Math.PI / pairs.length});
	g.selectAll('path')
	    .data(pairs)
	    .enter()
	    .append('path')
	    .attr('fill', (d,i) => { return colors[d[r['color']]] })
	    .attr('d', arc);
    });
    
};

d3.csv('./allegations.csv').then(
    (d) => {
	let by_year = load_data(d);
	elt_year.setAttribute('value','2018');
	elt_cmp_race.value = 'Black';
	elt_mos_race.value = 'White';
	handle_data(by_year);
	[elt_year,elt_cmp_race,elt_mos_race].forEach((e) => {
	    e.addEventListener('change', () => handle_data(by_year))	
	});
    },
    () => console.log('Error!')
);
