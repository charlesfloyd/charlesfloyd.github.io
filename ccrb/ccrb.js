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

// Margins
const margin = {
    top:20,
    left:20,
    bottom:20,
    right:20
};

const w = window.innerWidth - margin.left - margin.right;
const h = window.innerHeight - margin.top - margin.bottom;

global.gs = {};

window.onload = () => {

    global.svg = d3.select('body')
	.append("svg")
	.attr('width', w)
	.attr('height', h);
    
    // bar charts will be clickable: year, claimant_race, officer_race, allegation_type
    
    var g_of_xy_mult = (xmult, ymult) => {
	return svg.append('g')
	    .attr('transform',
		  'translate(' + (margin.left + xmult * w)
		  + ',' + (margin.top + ymult * h) + ')');
    };
    const g_xmult = 0;
    const g_ymult = 0;
    [
	{name:'Year', col:'year_received'},
	{name:'Complainant Race', col:'complainant_ethnicity'},
	{name:'Officer Race', col:'mos_ethnicity'},
	{name:'Complaint Type', col:'fado_type'},
	{name:'Contact Reason', col:'contact_reason_category'},
	{name:'Contact Result', col:'contact_result'},
	{name:'Resolution Months', col:'resolution_months'},
	{name:'Complaint Result', col:'complaint_result'},
    ].forEach((d, i) => {
	d['g'] = g_of_xy_mult(g_xmult, g_ymult);
	d['max_h'] = 0.1 * h * (1 - g_ymult) * (i+1);
	d['min_h'] = 0.1 * h * (1 - g_ymult) * i;
	d['max_w'] = (1 - g_xmult) * w;
	d['j'] = i;
	gs[d.name] = d
    });
};

global.filters = [];

const initialize_gs = (data) => {
    Object.entries(gs).forEach((d) => {
	let curr = d[1];
	curr['xs'] = {};
	let counts = Object.entries(ccrblib.organize_data(data, curr.col, []));
	let n = counts.length;
	let rect_w = curr.max_w / n;
	let max_label_w = d3.max(counts, (ar) => ar[0].length + 1);
	let font_size = 1.75 * rect_w / max_label_w;
	curr['font_size'] = font_size;
	curr['width'] = rect_w;
	counts.forEach((c, i) => {
	    // console.log(c[0], i);
	    curr.xs[c[0]] = rect_w * i;
	});
	curr.g.selectAll('text')
	    .data(counts)
	    .enter()
	    .append('text')
	    .attr('x',(d) => curr.xs[d[0]]) //,i)=>rect_w * (i+0.5))
	    .attr('y',(d) => {return curr.max_h})
	    .style('font-size', font_size)
	    .text((d)=>d[0])
	    .attr('fill','blue');
    });
    update_gs(data, []);
};

const update_gs = (data, filters) => {
    Object.entries(gs).forEach((d) => {
	let curr = d[1];
	let label = d[0];
	let font_size = curr.font_size;
	let g = curr.g;
	let counts = Object.entries(
	    ccrblib.organize_data(data, curr.col, filters)
	);
	let max_count = d3.max(counts, (ar) => ar[1]) * 1.1;
	var scale = d3.scaleLinear()
	    .domain([0, max_count])
	    .range([curr.max_h - font_size, curr.min_h]);
	let rect_h = (ar) => {return curr.max_h - font_size - scale(ar[1])};
	let axis = d3.axisLeft()
	    .scale(scale)
	    .ticks(5);
	g.selectAll('rect')
	    .data(counts)
	    .enter()
	    .append('rect')
	    .attr('x',(d,i) => curr.xs[d[0]]) //return rect_w * i})
	    .attr('y',(d,i) => {return scale(d[1])})
	    .attr('width', curr.width)
	    .attr('height', rect_h)
	    .on('click', (d) => {
		// console.log(d, filters, typeof filtersz);
		let new_f = {field:curr.col,value:d[0]};
		if (filters.some((f) => {return ccrblib.objeq(f,new_f)})) {
		    console.log('removing', new_f);
		    filters = filters.filter((f) => {return !ccrblib.objeq(f,new_f)})
		} else {
		    console.log('adding', new_f);
		    filters.push(new_f)
		};
		console.log('filters is:', filters);
		Object.entries(gs).forEach((x) => {
		    x[1].g.selectAll('rect').remove();
		});
		update_gs(data, filters);
	    });
    });
}

//const initialize_gs = (data) => update_gs(data, [])

d3.csv('./allegations.csv').then(
    (data) => {
	data = data.map(ccrblib.update_dict);
	initialize_gs(data)
    },
    () => console.log('Error!')
);
 
