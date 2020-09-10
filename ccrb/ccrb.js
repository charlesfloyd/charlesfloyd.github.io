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
    [{name:'Year', col:'year_received',ymult:0},
     {name:'Complainant Race', col:'complainant_ethnicity', ymult:0.15},
     {name:'Officer Race', col:'mos_ethnicity', ymult:0.3},
     {name:'Complaint Type', col:'fado_type', ymult:0.45}].forEach((d, i) => {
	 console.log('i is', i);
	 d['g'] = g_of_xy_mult(0, d.ymult);
	 d['max_h'] = 0.15 * h;
	 d['j'] = i;
	 gs[d.name] = d
     });
}
const initialize_gs = (data) => {
    console.log(margin, w, h);
    console.log('here');
    console.log('data has length', data.length, typeof data);
    Object.entries(gs).forEach((d) => {
	let curr = d[1];
	let label = d[0];
	console.log(curr);
	let g = curr.g;
	let counts = Object.entries(
	    ccrblib.organize_data(data, curr.col,[])
	);
	let max_h = d3.max(counts, (ar) => ar[1]);
	console.log(counts, 'max_h is',max_h);
	let n = counts.length;
	let rect_w = w / n;
	let rect_h = (ar) => {return ar[1] / max_h * curr.max_h};
	let max_label_w = d3.max(counts, (ar) => ar[0].length + 1);
	let font_size = 1.75*  rect_w / max_label_w;
	g.selectAll('rect')
	    .data(counts)
	    .enter()
	    .append('rect')
	    .attr('x',(d,i) => {return rect_w * i})
	    .attr('y',(d) => curr.max_h - rect_h(d) + curr.j * curr.max_h)
	    .attr('width', rect_w)
	    .attr('height', rect_h);
	g.selectAll('text')
	    .data(counts)
	    .enter()
	    .append('text')
	    .attr('x',(d,i)=>rect_w * i)
	    .attr('y',curr.max_h * (curr.j + 1) + font_size + 1)
	    .text((d)=>d[0])
	    .style('font-size', font_size)
	    .attr('fill','blue');
	
    });
};

d3.csv('./allegations.csv').then(
    (d) => {
	initialize_gs(d)
    },
    () => console.log('Error!')
);
