end_tokens = new Set(['Other', 'Other Attack', 'Other Threat', 'Refused'])
solo_tokens = new Set(['Not Provided', 'No unusual condition noted', 'No Injury'  ])
split_using_tokens = (responses_list) => {
    pieces = []
    curr = []
    responses_list.forEach((x, i) => {
        if (solo_tokens.has(x)) { 
            pieces.push(curr)
            pieces.push([x])
            curr = []
        } else if (end_tokens.has(x)) {
            curr.push(x)
            pieces.push(curr)
            curr = []
        } else curr.push(x)
    })
    pieces.push(curr)
    return pieces.filter((ar) => ar.length > 0)
}
split_on_duplicates = (items) => {
    var seen = new Set()
    var accum = []
    var curr = []
    items.forEach((item) => {
        if (seen.has(item)) {
            accum.push(curr)
            curr = [item]
            seen = new Set([item])
        } else {
            curr.push(item)
            seen.add(item)
        }
    })
    if (curr.length > 0) {
        accum.push(curr)
    }
    return accum
}
split_responses_string = (responses_string) => {
    const s_len = responses_string.length
    var accum = []
    var curr = ''
    responses_string.split('').forEach((c, i) => {
        if ((c == ',') && (s_len >= i) && (responses_string[i+1] != ' ')) {
            if (curr) {accum.push(curr)}
            curr = ''
        } else {
            curr += c
        }
    })
    if (curr) {accum.push(curr)}
    if (accum == undefined) {console.log(responses_string + ' gave undefined list!')}
    return accum
}

assign_subject_responses = (
    subject_objects, field, responses_string
    ) => {
    responses_list = split_responses_string(responses_string)
    responses_set = new Set(responses_list)
    dupe_split_responses = split_on_duplicates(responses_list)
    token_split_responses = split_using_tokens(responses_list)
    // if (subject_objects[0]['row_number'] == 11775) {
    //     console.log(
    //         subject_objects.length, responses_list, responses_set, 
    //         dupe_split_responses, token_split_responses
    //     )
    // }
    if ((responses_list.length == 1) || (subject_objects.length == 1)) {
        return subject_objects.map(
            (x) => Object.assign({}, x, {[field]:responses_list})
            )
    } else if (responses_set.size == 1) {
        return subject_objects.map(
            (x) => Object.assign(
                {}, x, {[field]: [responses_list[0]]}
                )
            )
    } else if (subject_objects.length == responses_list.length) {
        return subject_objects.map(
            (x, i) => Object.assign(
                {}, x, {[field]: [responses_list[i]]}
                )
            )
    } else if (subject_objects.length > responses_list.length) { 
        console.log(
            "Couldn't parse", field,
            "on row", subject_objects[0]['row_number'], 
            "for", subject_objects.length, 
            "objects:", responses_list
            )
        return subject_objects.map(
            (x) => Object.assign(
                {}, x, {[field]: ["Can't assign:" + responses_string]}
                )
            )
    } else if (dupe_split_responses.length == subject_objects.length) {
        return subject_objects.map(
            (x,i) => Object.assign(
                {}, x, {[field]: dupe_split_responses[i]}
                )
            )
    } else if (token_split_responses.length == subject_objects.length) {
        return subject_objects.map(
            (x,i) => Object.assign(
                {}, x, {[field]: token_split_responses[i]}
                )
            )   
    } else {
            console.log(
                "Couldn't parse", field,
                "on row", subject_objects[0]['row_number'], 
                "for", subject_objects.length, 
                "objects:", responses_list
                )
            return subject_objects.map(
            (x) => Object.assign(
                {}, x, {[field]: ["Can't assign:" + responses_string]}
                )
            )
    }
}

drop_fields = ['IncidentDate','officer_in_uniform','other_officer_involved']
keep_fields = [
    'County','agency_name','contact_origin',
    'location_type','incident_type','officer_injuries_medical_treatme',
    'video_footage','officer_injuries_injured','incident_municipality',
    'incident_case_number',
    'indoor_or_outdoor','video_type','incident_weather','planned_contact',
    'incident_lighting','officer_hospital_treatment','report_number',
    'INCIDENTID','SubjectInjuredinIncident_sum','SubjectInjuries',
    'SubjectInjuredprior_sum','TotalSubInjuredIncdient','SubectsArrested',
    'ReasonNotArrest','SubectsAge','SubectsGender','SubjectRace',
    'interaction_what','SubActions','SubResist','SubMedicalTreat',
    'OffInjuryType','OFFMEDTREAT2','incident_date',
    'subject_type','Officer_Name2','Officer_Name_Agency','officer_race',
    'officer_rank','officer_gender_fill'
]
subject_init_field = 'SubectsAge'
subject_split_fields = ['SubjectInjuries','SubectsArrested',
    'ReasonNotArrest','SubectsGender','SubjectRace','PerceivedCondition',
    'interaction_what','SubActions','SubResist','SubMedicalTreat',
    'subject_type']

duplicate_record_by_subject = (obj, i) => {
    obj['row_number'] = i
    drop_fields.forEach((f) => {delete obj[f]})
    subject_objects = split_responses_string(
        obj[subject_init_field]
        ).map((resp) => {
            curr_obj = Object.assign({}, obj)
            curr_obj[subject_init_field] = resp
            return curr_obj
        })
        
        if (subject_objects != undefined) {
        subject_split_fields.forEach((f) => {
            subject_objects = assign_subject_responses(
                subject_objects, f, obj[f]
            )
        })
        return subject_objects
    } else { return [] }
}

Promise.all(
    [d3.csv('./20201001_20210731.csv'),d3.csv('./co-est2019-alldata.csv')]
).then(
    ([uof, census]) => {
        first_few = uof.slice(0,5)
        // console.log(first_few)
        by_subject_records = uof.map(
            (obj, i) => {
                return duplicate_record_by_subject(obj, i)
                // console.log(duplicate_record_by_subject(obj, i))
            }
        )
        console.log(by_subject_records.flat().length)
    }
)

// Promise.all(
//     [d3.csv('./20201001_20210731.csv'), 
//     d3.csv('./co-est2019-alldata.csv')]
//     ).then(
//     ([use_of_force, census]) => {
//         console.log(use_of_force[0])
//         county_counts = _.countBy(use_of_force, (x) => x.County)
//         console.log(county_counts)
//         tmp = _.groupBy(use_of_force, 'County')
//         tmp2 = _.mapValues(
//                 tmp, 
//                 (x) => {
//                     curr = new Set()
//                     Object.values(x).forEach(function (d) {
//                         let v = d['incident_case_number']
//                         curr.add(v.toUpperCase())
//                         // curr.add(v)
//                     })
//                     return curr.size
//                 })
//         tmp3 = _.mapValues(
//             tmp,
//             (x) => x.length
//         )
//         console.log(tmp2)
//         console.log(tmp3)
//         const data = {
//             labels: Object.keys(county_counts),
//             datasets: [{
//                 label:'incident rows by county',
//                 backgroundColor:'white',
//                 borderColor:'green',
//                 data:Object.values(county_counts)
//             }]
//         }
//         const config = {
//             type: 'line',
//             data,
//             options: {}
//         }

//         var countyChart = new Chart(
//                 document.getElementById('countyChart'),
//                 config
//                 );
//     }
// )
    