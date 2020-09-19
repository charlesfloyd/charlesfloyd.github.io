"use strict";

const _ = require('lodash');

const resolution_years = (d) => {
    let diff = d.year_closed - d.year_received + (d.month_closed - d.month_received) / 12
    return diff
};

const resolution_months = (d) => { return 12 * resolution_years(d) };

const handle_data_by_year = (year, data) => {
    let total_complaints = data.length
    let counts_mos =  _.countBy(data, (d) => {
	return d.mos_ethnicity
    });
    let counts_cmp = _.countBy(data, (d) => {
	return d.complainant_ethnicity
    });
    let summary_data = [];
    let g = _.groupBy(data, (d) => {
	return[d.mos_ethnicity, d.complainant_ethnicity]
    });
    Object.keys(g).forEach((k) => {
	let mos = k.split(',')[0];
	let cmp = k.split(',')[1];
	summary_data.push({
	    year: year,
	    mos_race: mos,
	    cmp_race: cmp,
	    complaints_by_cmp_against_mos: g[k].length,
	    pct_total_complaints_by_cmp: counts_cmp[cmp] / total_complaints,
	    pct_total_complaints_against_mos: counts_mos[mos] / total_complaints,
	    pct_complaints_by_cmp_against_mos: g[k].length / counts_cmp[cmp],
	    pct_complaints_against_mos_by_cmp: g[k].length / counts_mos[mos],
	});
    });
    return summary_data;
    // console.log(summary_data);
};

const get_annual_stats = (data) => {
    var all_years = _.groupBy(data, (d) => { return d.year_received })
    var by_year = {};
    Object.keys(all_years).forEach((k) => {
	by_year[k] = handle_data_by_year(k, all_years[k])
    });
    // console.log(by_year)
    return by_year
};

const organize_data = (data, group_field, filters) => {
    console.log('applying filters');
    filters.forEach((d) => {
	data = data.filter((x) => {return x[d.field] === x[d.value]})
    });
    console.log('remaining data has length', data.length);
    console.log(group_field, Object.keys(data[0]));    
    return _.countBy(data, (d) => { return d[group_field] })
};
      
const complaint_result = (d) => {
    let res = d.board_disposition;
    if (/Substantiated/.test(res)) {return 'Substantiated'}
    else if (/Unsubstantiated/.test(res)) {return 'Unsubstantiated'}
    else if (/Exonerated/.test(res)) {return 'Exonerated'}
    else {return ''}
};


const contact_reasons = [
    ['CV Init', /^C\/V/],
    ['Suspected Crm', /^PD suspected C\/V/],
    ['Reported Crm', /^Report/],
    ['Moving Violn', /^Moving violation/],
    ['Executing Wrnt', /^Execution of/],
    ['Parking Violn', /^Parking/],
    ['Patrol Enctr', /^Patrol/],
    ['Stop Qstn Frsk', /^Stop/],
    ['Traffic Enctr', /^Traffic/],
    ['Reported Othr', /^Other/]
];

const contact_reason = (d) => {
    let reason = d.contact_reason;
    let response = 'Miscellaneous';
    for (let i = 0; i < contact_reasons.length; i++) {
	let curr = contact_reasons[i];
	if (curr[1].test(reason)) {
	    response = curr[0]
	    break
	}
    }
    return response
};
const contact_result = (d) => {
    if (/Arrest/.test(d.outcome_description)) {return 'Arrest';}
    else if (/(Summons|Moving)/.test(d.outcome_description)) {return 'Summons';}
    else if (/No arrest/.test(d.outcome_description)) {return 'No Arrest/Summons';}
    else {return 'Other'}
};

const update_dict = (d) => {
    d['resolution_months'] = Math.round(Math.max(0, (Math.min(24,resolution_months(d)))));
    d['complaint_result'] = complaint_result(d);
    d['contact_reason_category'] = contact_reason(d);
    d['contact_result'] = contact_result(d);
    return(d);
};

module.exports = {
    update_dict: update_dict,
    organize_data: organize_data
};
