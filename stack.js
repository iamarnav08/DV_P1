const width = 980;
const height = 600;
const margin = { top: 40, right: 40, bottom: 60, left: 80 };
const pancakeHeight = 20;

// Create SVG container
const svg = d3.select("#visualization")
  .append("svg")
  .attr("width", width)
  .attr("height", height);



// Load and process data
d3.csv("data.csv").then(data => {
  const wins = { Olney: 0, Liberal: 0, NoWins: 0 };
  const years = { Olney: [], Liberal: [] };
  const winners = { Olney: [], Liberal: [] };
  
  data.forEach(d => {
    if (d.Winner === "O") {
      wins.Olney++;
      years.Olney.push(d.Year);
      winners.Olney.push(d.Olney);
    } else if (d.Winner === "L") {
      wins.Liberal++;
      years.Liberal.push(d.Year);
      winners.Liberal.push(d.Liberal);
    } else {
      wins.NoWins++;
    }
  });

  // Update the summary table
  document.getElementById("olney-wins").textContent = wins.Olney;
  document.getElementById("liberal-wins").textContent = wins.Liberal;
  document.getElementById("no-wins").textContent = wins.NoWins;

  // Sort years in ascending order
  years.Olney.sort((a, b) => a - b);
  years.Liberal.sort((a, b) => a - b);

  const maxWins = Math.max(wins.Olney, wins.Liberal);

  const xScale = d3.scaleBand()
    .domain(["Olney", "Liberal"])
    .range([margin.left, width - margin.right])
    .padding(0.4);

  const yScale = d3.scaleLinear()
    .domain([0, maxWins + 1])
    .range([height - margin.bottom, margin.top]);

  let activePancake = null;
  let animationInProgress = true;

  const pancakes = [];

  ["Olney", "Liberal"].forEach(town => {
    for (let i = 0; i < wins[town]; i++) {
      // Original coordinates
      const homeX = xScale(town) + xScale.bandwidth() / 2;
      const homeY = yScale(i + 1);

      // Create the pancake
      const pancake = svg.append("ellipse")
        .attr("class", "pancake")
        .attr("data-homex", homeX)
        .attr("data-homey", homeY)
        .attr("cx", homeX)
        .attr("cy", height - margin.bottom) // Start from bottom
        .attr("rx", xScale.bandwidth() / 2)
        .attr("ry", pancakeHeight / 2)
        .attr("data-year", years[town][i])
        .attr("data-winner", winners[town][i])
        .style("cursor", "pointer") // change cursor on hover
        .on("mouseover", function() {
          if (activePancake || animationInProgress) return;

          d3.select(this)
            .transition()
            .duration(200)
            .style("fill", "#d4a017") // Darker yellow on hover
            .attr("rx", xScale.bandwidth() / 1.5)
            .attr("ry", pancakeHeight / 1.5)
            .attr("stroke-width", 4);

          // Remove old bubble if present
          d3.select("#bubble").remove();

          // Add bubble at a further offset so it doesn't overlap
          const bubbleExtraOffset = (town === "Olney") ? -200 : 200;
          const pancakeCY = +d3.select(this).attr("cy");
          const pancakeOriginalX = +d3.select(this).attr("data-homex");

          const bubbleGroup = svg.append("g")
            .attr("id", "bubble")
            .attr("transform", `translate(${pancakeOriginalX + bubbleExtraOffset}, ${pancakeCY})`);

          const bubbleWidth = 160;
          const bubbleHeight = 60;

          bubbleGroup.append("rect")
            .attr("x", -bubbleWidth / 2)
            .attr("y", -bubbleHeight / 2)
            .attr("width", bubbleWidth)
            .attr("height", bubbleHeight)
            .attr("rx", 10)
            .attr("ry", 10)
            .attr("fill", "#fff")
            .attr("stroke", "#000")
            .attr("stroke-width", 2);

          bubbleGroup.append("text")
            .attr("x", 0)
            .attr("y", -10)
            .attr("text-anchor", "middle")
            .attr("font-size", "14px")
            .attr("font-weight", "bold")
            .attr("fill", "black")
            .text("Year: " + d3.select(this).attr("data-year"));

          bubbleGroup.append("text")
            .attr("x", 0)
            .attr("y", 10)
            .attr("text-anchor", "middle")
            .attr("font-size", "14px")
            .attr("font-weight", "bold")
            .attr("fill", "black")
            .text("Winner: " + d3.select(this).attr("data-winner"));
        })
        .on("mouseout", function() {
          if (activePancake || animationInProgress) return;

          d3.select(this)
            .transition()
            .duration(200)
            .style("fill", "#f4c430") // Original color
            .attr("rx", xScale.bandwidth() / 2)
            .attr("ry", pancakeHeight / 2)
            .attr("stroke-width", 3);
          d3.select("#bubble").remove();
        });

      pancakes.push({ pancake, homeX, homeY, year: years[town][i], town });
    }
  });

  // Sort pancakes by year
  pancakes.sort((a, b) => a.year - b.year);

  // Animate the pancake stacking one by one
  pancakes.forEach((p, i) => {
    p.pancake.transition()
      .duration(300) // Faster animation
      .delay(i * 300)
      .attrTween("cx", function() {
        return function(t) {
          return p.homeX + (Math.sin(t * Math.PI) * 100 * (p.town === "Olney" ? -1 : 1));
        };
      })
      .attrTween("cy", function() {
        return function(t) {
          return height - margin.bottom - (t * (height - margin.bottom - p.homeY));
        };
      })
      .on("start", function() {
        // Flash the year in the middle of the graph
        svg.append("text")
          .attr("id", "flashYear")
          .attr("x", width / 1.925)
          .attr("y", height / 2)
          .attr("text-anchor", "middle")
          .attr("font-size", "40px")
          .attr("font-weight", "bold")
          .attr("fill", "black")
          .text(p.year)
          .transition()
          .duration(300)
          .style("opacity", 0)
          .remove();
      })
      .on("end", function() {
        if (i === pancakes.length - 1) {
          animationInProgress = false;

          // Add red dot at top of Olney stack
          svg.append("circle")
            .attr("cx", xScale("Olney") + xScale.bandwidth() / 2)
            .attr("cy", yScale(wins.Olney))
            .attr("r", 4)
            .attr("fill", "red");

          // Add red dot at top of Liberal stack  
          svg.append("circle")
            .attr("cx", xScale("Liberal") + xScale.bandwidth() / 2)
            .attr("cy", yScale(wins.Liberal))
            .attr("r", 4)
            .attr("fill", "red");

          // Line from top pancake to y-axis
          svg.append("line")
            .attr("x1", xScale("Olney") + xScale.bandwidth() / 2)
            .attr("y1", yScale(wins.Olney))
            .attr("x2", margin.left)
            .attr("y2", yScale(wins.Olney))
            .attr("stroke", "red")
            .attr("stroke-width", 4);

          svg.append("line")
            .attr("x1", xScale("Liberal") + xScale.bandwidth() / 2)
            .attr("y1", yScale(wins.Liberal))
            .attr("x2", margin.left)
            .attr("y2", yScale(wins.Liberal))
            .attr("stroke", "red")
            .attr("stroke-width", 4);

          
        }
      });
  });

  // Axes
  const xAxis = d3.axisBottom(xScale).tickSizeOuter(10);
  const yAxis = d3.axisLeft(yScale).ticks(maxWins).tickSizeOuter(10);

  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(xAxis)
    .selectAll("text")
    .attr("font-size", "20px");

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(yAxis)
    .selectAll("text")
    .attr("font-size", "14px");

  // Add arrow markers
  svg.selectAll(".domain")
    .attr("stroke-width", 2)
    .attr("marker-end", (d, i) => i === 0 ? "url(#arrowY)" : "url(#arrowX)");

  // Axis labels
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height - 10)
    .attr("text-anchor", "middle")
    .attr("fill", "black")
    .attr("font-size", "24px")
    .attr("font-weight", "bold")
    .attr("font-family", "Arial, sans-serif")
    .text("Towns");

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .attr("fill", "black")
    .attr("font-size", "24px")
    .attr("font-weight", "bold")
    .attr("font-family", "Arial, sans-serif")
    .text("Number of Wins");
});
