svg = d3.select('g')
    .append('svg')
    .attr('width', window.innerWidth / 2)
    .attr('height', window.innerHeight / 2)

let get_tip_content = (d) => {
    return '<br>County: ' + d.properties.county
}
var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-1, 0])
    .html(function (i, d) {
        return "<span style='color:white'>" + get_tip_content(d) + "</span>"
    });




const display_page = (use_of_force_data, njcounties) => {
    tabledata = use_of_force_data.filter(
        (x) => {return x.county == 'Essex'}
        ).slice(0,20)
    county_incident_counts = _.countBy(use_of_force_data, (x) => x.county)
    console.log(county_incident_counts)
    
    let container = document.getElementById('example');
    let hot = new Handsontable(container, {
        data: tabledata,
        rowHeaders: true,
        colHeaders: true,
        licenseKey: 'non-commercial-and-evaluation'
    });

    var on_mouseover = (i,d) => {
    tip.show(i,d);
    currdata = use_of_force_data.filter(
        (x) => {return d.properties.county == x.county}
        ).slice(0,20)
    tabledata = currdata
    hot.data = currdata
    hot.render()
    }

    projection = d3.geoAlbersUsa().fitSize([190, 300], njcounties)
    path = d3.geoPath().projection(projection)
    svg.call(tip)
    svg.selectAll('path')
        .data(njcounties.features)
        .join('path')
        .attr('class', 'county')
        .attr('d', path)
        .attr('stroke', 'white')
        .attr('fill', 'green')
        .attr('stroke-width', 0.35)
        .style('opacity', 0.65)
        .on('mouseover', on_mouseover)
        .on('mouseout', tip.hide)

 

}

p1 = d3.csv('./20201001_20210228.csv')
p2 = d3.json(
    'http://data.ci.newark.nj.us/dataset/db87f66a-6d79-4933-9011-f392fdce7eb8/resource/95db8cad-3a8c-41a4-b8b1-4991990f07f3/download/njcountypolygonv2.geojson'
    )
Promise.all([p1, p2]).then(
    ([use_of_force, njcounties]) => {
        display_page(use_of_force, njcounties)
    },
    () => console.log('Error!!')
)