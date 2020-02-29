// Map csv aliases to pretty aliases
var colsMap = {
    "avg_Parent_Rank": "Avg. Parent Rank",
    "avg_Student_Rank": "Avg. Student Rank",
    "pc_Parents_Q1": "% Parents Q1",
    "pc_Parents_Q5": "% Parents Q5",
    "pc_Students_Q1": "% Students Q1",
    "pc_Students_Q5": "% Students Q5"
};

// Attribution for starter code - https://bl.ocks.org/Fil/6d9de24b31cb870fed2e6178a120b17d

// Setting up the canvas
var width = 960,
    padding = 15,
    size = (700 - padding) / 6;


var x = d3.scaleLinear()
    .range([padding / 2, size - padding / 2]);

var y = d3.scaleLinear()
    .range([size - padding / 2, padding / 2]);

// Set gridlines
var xAxis = d3.axisBottom()
    .scale(x)
    .ticks(2)
    .tickFormat(num => String(num));

var yAxis = d3.axisLeft()
    .scale(y)
    .ticks(2)
    .tickFormat(year => String(year));

// Colors for 3rd dimension data
var color = d3.scaleOrdinal(d3.schemeCategory10);

d3.csv("Mobility_Filtered.csv").then(function (data) {
    console.log(data);

    // Wrangle data. Make numeric
    data.forEach(function (d) {
        d.pc_Parents_Q1 = +d.pc_Parents_Q1;
        d.pc_Parents_Q5 = +d.pc_Parents_Q5;
        d.pc_Students_Q1 = +d.pc_Students_Q1;
        d.pc_Students_Q5 = +d.pc_Students_Q5;
        d.avg_Parent_Rank = +d.avg_Parent_Rank;
        d.avg_Student_Rank = +d.avg_Student_Rank;
    });

    var domainByCol = {},
        cols = d3.keys(data[0]).filter(d => d !== "college_Tier" && d !== "name"),
        n = cols.length;
    console.log(cols.length);

    cols.forEach(function (col) {
        console.log(d3.extent(data, d => d[col]));
        domainByCol[col] = col.startsWith("avg") ? ["0", "1"] : ["0", "100"];
        console.log(domainByCol[col]);
    });

    xAxis.tickSize(size * n);
    yAxis.tickSize(-size * n);

    var brush = d3.brush()
        .on("start", brushstart)
        .on("brush", brushmove)
        .on("end", brushend)
        .extent([[0, 0], [size, size]]);

    var svg = d3.select("#scatter-plot-matrix").append("svg")
        .attr("width", width)
        .attr("height", size * n + 20)
        .append("g")
        .attr("transform", "translate(" + 20 + "," + padding / 2 + ")");

    svg.selectAll(".x.axis")
        .data(cols)
        .enter().append("g")
        .attr("class", "x axis")
        .attr("transform", function (d, i) { return "translate(" + i * size + ",0)"; })
        .each(function (d) {
            x.domain(domainByCol[d]);
            d3.select(this).call(xAxis);
        });

    svg.selectAll(".y.axis")
        .data(cols)
        .enter().append("g")
        .attr("class", "y axis")
        .attr("transform", function (d, i) {
            return "translate(0," + i * size + ")";
        })
        .each(function (d) {
            y.domain(domainByCol[d]);
            d3.select(this).call(yAxis);
        });

    var cell = svg.selectAll(".cell")
        .data(cross(cols, cols))
        .enter().append("g")
        .attr("class", "cell")
        .attr("transform", function (d) {
            return "translate(" + d.i * size + "," + d.j * size + ")";
        })
        .each(plot);

    // Titles for the diagonal.
    cell.filter(function (d) { return d.i === d.j; }).append("text")
        .attr("x", padding)
        .attr("y", padding)
        .attr("dy", ".71em")
        .text(function (d) {
            return d.xPretty;
        });

    // cell.call(brush);

    function plot(p) {
        var cell = d3.select(this);

        x.domain(domainByCol[p.x]);
        y.domain(domainByCol[p.y]);

        cell.append("rect")
            .attr("class", "frame")
            .attr("x", padding / 2)
            .attr("y", padding / 2)
            .attr("width", size - padding)
            .attr("height", size - padding);

        cell.selectAll("circle")
            .data(data)
            .enter().append("circle")
            .attr("cx", function (d) {
                return x(d[p.x]);
            })
            .attr("cy", function (d) {
                return y(d[p.y]);
            })
            .attr("r", 1.5)
            .style("fill", function (d) {
                return color(d.college_Tier);
            });
    }

    var brushCell;

    // Clear the previously-active brush, if any.
    function brushstart(p) {
        if (brushCell !== this) {
            d3.select(brushCell).call(brush.move, null);
            brushCell = this;
            x.domain(domainByCol[p.x]);
            y.domain(domainByCol[p.y]);
        }
    }

    // Highlight the selected circles.
    function brushmove(p) {
        var e = d3.brushSelection(this);
        svg.selectAll("circle").classed("hidden", function (d) {
            return !e
                ? false
                : (
                    e[0][0] > x(+d[p.x]) || x(+d[p.x]) > e[1][0]
                    || e[0][1] > y(+d[p.y]) || y(+d[p.y]) > e[1][1]
                );
        });
    }

    // If the brush is empty, select all circles.
    function brushend() {
        var e = d3.brushSelection(this);
        if (e === null) svg.selectAll(".hidden").classed("hidden", false);
    }

    // add legend   
    // Attribution - https://www.d3-graph-gallery.com/graph/custom_legend.html
    var legend = svg.append("g")
        .attr("class", "legend")
        .attr("x", width - 65)
        .attr("y", 25)
        .attr("height", 100)
        .attr("width", 100);

    legend.selectAll('g').data(["Selective - Highly Selective", "Less Selective / Insufficient Data"])
        .enter()
        .append('g')
        .each(function (d, i) {
            var g = d3.select(this);
            g.append("rect")
                .attr("x", 700 - 65)
                .attr("y", i * 25)
                .attr("width", 10)
                .attr("height", 10)
                .style("fill", color(d))
                .attr("transform", "translate(100,50)");

            g.append("text")
                .attr("x", 700 - 50)
                .attr("y", i * 25 + 8)
                .attr("height", 30)
                .attr("width", 100)
                .style("fill", "black")
                .text(d)
                .attr("transform", "translate(100,50)");


        });
    d3.select('.legend').append("text")
        .attr("x", 700 - 50)
        .attr("y", 0)
        .attr("height", 30)
        .attr("width", 100)
        .style("fill", "black")
        .text("College Tier (group)")
        .attr("transform", "translate(85,30)");
});

// draws matrix
function cross(a, b) {
    var c = [];
    for (let i = 0; i < a.length; i++) {
        for (let j = b.length - 1; j >= 0; j--) {
            c.push({
                x: a[i],
                xPretty: colsMap[a[i]],
                i: i,
                y: b[j],
                j: j
            });
        }
    }
    console.log(c)
    return c;
}


