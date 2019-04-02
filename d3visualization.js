// development server command
// python -m SimpleHTTPServer 8000

// declare global variables to be used
var bps;
var current_selection = "math"; // keep track of what the user wants to see
var current_selection_grade = "K0"
var current_data = [];
var subjects = []; // this is used in the dropdown selection
var grades = []; // also used in the dropdown selection
var gradesCustom = ["K0", "K1", "K2", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
var svg;
var svg_scatterplot;

// generalists
var math_data = {};
var ela_data = {};
var science_data = {};
var socialstudies_data = {};

// specialists
var specialist_ela_data = {};
var specialist_electives_data = {};
var specialist_language_data = {};
var specialist_math_data = {};
var specialist_pe_data = {};
var specialist_socialstudies_data = {};
var specialist_vpa_data = {};

// Function for bryce
function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}
function getKeyByValue(object, value) {
  return Object.keys(object).find(key => object[key] === value);
}
String.prototype.contains = function(it) { return this.indexOf(it) != -1; };

// *Big shoutout to @parkergriep for formatting the BPS data into JSON format*
//
// load the data in, then execute the desired functions
d3.json("bps.json", function(data) {
  // after the data is loaded, get the summary for generalist math and
  // display that visualization
  bps = data;
  console.log("start");


  // TODO: show a preset visualization of the generalist math data
  current_data = getSummary(current_selection);
  updateBarGraphAndOppositeDiagram();
  createDropdown();
});

function loadData() {
  d3.json("bps.json", function(data) {
    bps = data;
    current_data = getSummary(current_selection);
    updateBarGraphAndOppositeDiagram();
  });
}

// Starting code based off of the bps_data_json repository
// calculate:
// number of users for each curriculum
// average rating for each curriculum
// average usage percentage for each curriculum
var getSummary = function(subject) {
  // filter for only the selected grade

  // Subjects for dropdown
  subjects = bps["names"];
  var bpsdata = bps["data"];
  $.each(bpsdata, function(i, sub) {
    $.each(sub, function(i, id) {
      if (id) {
      grades.push(id.grade);}
    });
  });
  grades = grades.filter(onlyUnique);

  // filter for grade level
  var tempBps = bps;
  $.each(tempBps["data"], function(index, sub) {
    $.each(sub, function(index2, element) {
      if (element) {
      if (element["grade"]) {
        if (!element["grade"].contains(current_selection_grade)) {
          delete bps["data"][index][index2];
        }
      }
      }
    });
  });



  // clear the current data
  var summaries = [];

  var resourceCodes = bps["meta"][subject]["resource_codes"];
  resourceCodes.forEach(rc => {
    var resourceName = bps["meta"][subject]["names"][rc];
  var ratingsum = 0;
  var ratingcount = 0;
  var usagecount = 0;
  var usagesum = 0;
  let summary = {};

  bps["data"][subject].forEach(entry => {
    var rating = entry[`resource_${rc}_rating`];
  var usage = entry[`resource_${rc}_usage`];

  if (rating) {
    ratingsum += Number(rating) || 0;
    ratingcount += 1;
  }

  if (usage) {
    usagesum += Number(usage) || 0;
    usagecount += 1;
  }

});

  summary["resource_name"] = resourceName;
  summary["avg_rating"] = (ratingsum / ratingcount) || 0; // account for div by zero
  summary["count_rating"] = ratingcount;
  summary["avg_usage"] = (usagesum / usagecount) || 0;
  summary["count_usage"] = usagecount;
  summaries.push(summary);
});

  return summaries;
};

// TODO: calculate the distribution of classes used in conjunction with the
//       set of passed in classes
var getDistribution = function() {

};

// Update the visualization
var updateBarGraphAndOppositeDiagram = function() {

  // call getSummary with the new "current_selection" subject
  // and store result in current_data

  var w = 1000;
  var h = 400;
  var padding = 50;

  // create appropriate scales for the data
  var xScale = d3.scaleBand()
    .domain(current_data.map(function(d) {
      return d.resource_name;
    }))
    .rangeRound([padding, w - padding])
    .paddingInner(.1);

  var yScale = d3.scaleLinear()
    .domain([0, d3.max(current_data, function(d, i) {
      // get the usage count from the current data
      return d.count_usage;
    })])
    .range([h - padding, padding]);

  // define axis for the bar geograph
  var xAxis = d3.axisBottom()
    .scale(xScale)
    .ticks(10);

  var yAxis = d3.axisLeft()
    .scale(yScale)
    .ticks(10);

  // create svg
  svg = d3.select("#bargraph")
    .append("svg")
    .attr("width", w)
    .attr("height", h);

  // create bars
  var bars = svg.selectAll("rect")
    .data(current_data)
    .enter()
    .append("rect")
    .attr("x", function(d, i) {
      return xScale(d.resource_name);
    })
    .attr("y", function(d, i) {
      return Math.round(yScale(current_data[i].count_usage));
    })
    .attr("width", xScale.bandwidth())
    .attr("height", function (d, i) {
      return Math.round(h - padding - yScale(current_data[i].count_usage));
    })
    .attr("fill", function(d, i) {
      return "rgb(0," + Math.round(((current_data[i].avg_rating / 7) * 255)) +
      " , " + Math.round(((current_data[i].avg_rating / 7) * 255))  + ")";
    })
    .on('mouseover', function(d) { dispatch.call("hovered", null, d.resource_name); })
    .on('mouseout', function(d) { dispatch.call("hovered", null, null); })
    .append("title")
    .text(function(d, i) {
      return "number of users: " +  current_data[i].count_usage + '\n' +
      "average percentage of usage: " + current_data[i].avg_usage + '\n' +
      "number of ratings: " + current_data[i].count_rating + '\n' +
      "average rating: " + current_data[i].avg_rating;
    });

  // TODO: create labels
  //svg.selectAll("text")
  //   .data()

  // TODO: create x and y axis
  svg.append("g")
    .attr("class", "x axis bar")
    .attr("transform", "translate(0," + (h - padding) + ")")
    .call(xAxis)
    .selectAll("text")
      .style("text-anchor", "end")
      .attr("transform", "rotate(-20)");


  svg.append("g")
    .attr("class", "y axis bar")
    .attr("transform", "translate(" + padding + ",0)")
    .call(yAxis);


  svg.append("text")
    .attr("transform", "translate(" + 50 + "," + 30 + ")")
    .style("text-anchor", "middle")
    .text("Responses");

  // TODO: create scatter plot ------------------------------------------------
  var sp_width = 500;
  var sp_height = 500;
  var sp_margins = {
    "left": 50,
    "right": 50,
    "top": 50,
    "bottom": 50
  };

  // TODO: scales
  var sp_xScale = d3.scaleLinear()
                    .domain([0, 100])
                    .range([sp_margins.left, sp_width - sp_margins.left - sp_margins.right]);

  var sp_yScale = d3.scaleLinear()
                    .domain([1, 7])
                    .range([sp_height - sp_margins.top - sp_margins.bottom, sp_margins.bottom]);

  // TODO: define axis
  var sp_xAxis = d3.axisBottom()
                   .scale(sp_xScale)
                   .ticks(10);

  var sp_yAxis = d3.axisLeft()
                   .scale(sp_yScale)
                   .ticks(7);

  // create svg element in scatterplot div
  svg_scatterplot = d3.select("#scatterplot")
    .append("svg")
    .attr("width", sp_width)
    .attr("height", sp_height)
    .append("g")
    .attr("transform", "translate(" + sp_margins.left + "," + sp_margins.top + ")");

  // create circles
  svg_scatterplot.selectAll("circle")
    .data(current_data)
    .enter()
    .append("circle")
    .attr("cx", function(d, i) {
      return sp_xScale(current_data[i].avg_usage);
    })
    .attr("cy", function(d, i) {
      return sp_yScale(current_data[i].avg_rating);
    })
    .attr("r", 5)
    .style("fill", function(d) {
      return "rgb(0, 0 , 150)";
    });

  // create labels
  svg_scatterplot.selectAll("text")
    .data(current_data)
    .enter()
    .append("text")
    .style("text-anchor", "middle")
    .attr("x", function(d, i) {
      return sp_xScale(current_data[i].avg_usage);
    })
    .attr("y", function(d, i) {
      return sp_yScale(current_data[i].avg_rating) - 10;
    })
    .text(function(d) {
      return d.resource_name;
    })
    .attr("font-size", "11px")
    .attr("fill", "");


  //create axis
  svg_scatterplot.append("g")
    .attr("class", "x axis scatter")
    .attr("transform", "translate(0," + ((sp_height - sp_margins.top) / 2) + ")")
    .call(sp_xAxis);

  svg_scatterplot.append("g")
    .attr("class", "y axis scatter")
    .attr("transform", "translate(" + ((sp_width - sp_margins.left) / 2) + ",0)")
    .call(sp_yAxis);
};

function createDropdown() {
  ////////////////////////////////////////////////////////////
  var dropdownChangeSubject = function() {
      var newSubject = d3.select(this).property('value');
      clearDiv("bargraph");
      clearDiv("scatterplot");
      current_selection = newSubject;
      current_data = getSummary(newSubject);
      updateBarGraphAndOppositeDiagram();
  };

  var dropdownChangeGrade = function() {
    var newGrade = d3.select(this).property('value');
    clearDiv("bargraph");
    clearDiv("scatterplot");
    current_selection_grade = newGrade;
    loadData();
  };

  var dropdownSubject = d3.select("#subject")
    .insert("select", "svg")
    .on("change", dropdownChangeSubject);

  dropdownSubject.selectAll("option")
    .data(Object.keys(subjects))
    .enter().append("option")
    .attr("value", function (d) {
      return d;
    })
    .text(function (d) {
      return subjects[d];
    });

  var dropdownGrade = d3.select("#grade")
    .insert("select", "svg")
    .on("change", dropdownChangeGrade);

  dropdownGrade.selectAll("option")
    .data(gradesCustom)
    .enter().append("option")
    .attr("value", function (d) { return d; })
    .text(function (d) {
      return d;
    });


};

function clearDiv(elementID)
{
  document.getElementById(elementID).innerHTML = "";
}

dispatch.on("hovered.bar", function(bar) {
  var bars = svg.selectAll("rect");
  if(bar) {
    bars.attr('fill', '#AAAAAA');
    bars.filter(function(d) {
      return d.resource_name === bar;
    }).attr('fill', '#000000');
  } else {
    bars.attr("fill", function(d, i) {
      return "rgb(0," + Math.round(((current_data[i].avg_rating / 7) * 255)) +
        " , " + Math.round(((current_data[i].avg_rating / 7) * 255))  + ")";
    })
  }
});

dispatch.on("hovered.point", function(node) {
  var nodes = svg_scatterplot.selectAll("circle");
  console.log(nodes);
  if(node) {
    nodes.style('fill', '#AAAAAA');
    nodes.filter(function(d) {
      // console.log(d.resource_name);
      // console.log(node);
      return d.resource_name === node;
    }).style('fill', '#000000');
  } else {
    nodes.style("fill", function(d) {
      return "rgb(0, 0 , 150)";
    });
  }
  console.log(nodes);
});
