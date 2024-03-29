import * as d3 from 'd3'

/**
 * nodelink() is a chart based on the Mike Bostock's towards reusable charts paradigm.
 * 
 * In typical d3 style, we chain attribute and instance methods to produce an updatable,
 * persistant chart. 
 */
export default function nodelink() {
    let root,
        setRoot,
        dimensions,
        source,     // the source of change in an interaction (eg. the node that was clicked)
        hover,
        exit,
        i = -1,     // we will use this for node keys
        treemap,    // a reference to the treemap 
        treemapSelection, 
        colorScale

    /**
     * my will be called on every update and render
     */
    const my = (selection) => {

        const { width, height } = dimensions

        // we grab the root from the treemap chart to find the current level
        const treemapRoot = treemap.treemapRoot()

        // the nodelink layout shall be alphabetically sorted
        root.sort((a, b) => a.data.name.localeCompare(b.data.name))

        // Compute the layout.
        const dx = 25;
        const dy = (width + 50) / (root.height + 1.3);
        d3.tree().nodeSize([dx, dy])(root);

        // Center the tree.
        let x0 = Infinity;
        let x1 = -x0;
        root.each(d => {
            if (d.x > x1) x1 = d.x;
            if (d.x < x0) x0 = d.x;
        });

        // Compute the default height.
        let treeHeight = x1 - x0 + dx * 2;

        const svg = selection
            .attr("font-family", "sans-serif")
            .attr("font-size", 20)
            .attr("width", width)
            .attr("height", height)

        // we add a transition to the viewbox so that when the opened nodes changes, the zooming is smooth
        svg.transition()
            .duration(700)
            .ease(d3.easeSin)
            .attr("viewBox", [-dy * 3 / 4, x0 - dx, width + dy / 2, treeHeight])

	      // here is our main group for the node elements
        svg.selectAll('.nodeG')
            .data([null]) // for idempotency
            .join("g")
            .attr('class', 'nodeG')
            .selectAll("g")
            .data(root.descendants(), d => d.id || (d.id = ++i)) // the specified key generates unique ids to ensure correct update logic below
            .join(
                (enter) => {
                    const node = enter.append('g')
                        .attr('class', 'node')
                        .style('cursor', d => d.children || d._children ? 'pointer' : 'default')
			                  // we initially insert the node at the source's location for a nice transition
			                  .attr('transform', `translate(${source.y},${source.x})`)
                        .style('outline', d => d === treemapRoot ? 'solid 2px black' : 'none')
                        .on('click', click)
                        .on('mouseover', hover)
                        .on('mouseout', exit)

		                // here we transition to the actual position
                    node.transition()
                        .duration(700)
                        .attr("transform", d => `translate(${d.y},${d.x})`)

		                // again we start a circle's size at zero so that it will grow "from nothing"
                    node.append('circle')
                        .attr('r', 0)
                        .transition()
                        .duration(700)
                        .call(updateCircle)
                        
                    node.append('text')
                        .attr('opacity', 0)
                        .transition()
                        .duration(700)
                        .call(updateText)
                },
                (update) => update.call(update => {
                    update
                        .transition()
                        .duration(700)
                        // update group position
                        .attr("transform", d => `translate(${d.y},${d.x})`)
                        .style('outline', d => d === treemapRoot ? 'solid 2px black' : 'none')

                    update.select('circle')
                        .call(updateCircle)

                    update.select('text')
                        .call(updateText)
                }),
                (exit) => {
                    exit
                        .transition()
                        .duration(700)
			                  // we slide the node to the collapsing node then remove it
                        .attr('transform', `translate(${source.y},${source.x})`)
                        .remove()

                    exit.select('circle')
                        .transition()
                        .duration(700)
                        .attr('r', 0)

                    exit.select('text')
                        .transition()
                        .duration(700)
                        .attr('opacity', 0)
                }
            )

	      // here is our main group for the link elements
        svg.selectAll('.linkG')
            .data([null])
            .join("g")
            .lower()
            .attr('class', 'linkG')
            .attr("fill", "none")
            .attr("stroke", '#999')
            .attr("stroke-opacity", 0.7)
            .attr("stroke-width", 2)
            .style('pointer-events', 'none')
            .selectAll("path")
	          // we will use the target node's is as the key becuase that is unique (one source can have many targets)
            .data(root.links(), d => d.target.id)	
            .join(
                (enter) =>
                    enter.append('path')
                        .attr("d", d3.linkHorizontal()
                            .x(source.y)
                            .y(source.x)
                        )
                        .transition()
                        .duration(700)
                        .attr("d", d3.linkHorizontal()
                            .x(d => d.y)
                            .y(d => d.x)
                        ),
                (update) =>
                    update.call(update => {
                        update
                            .transition()
                            .duration(700)
                            .attr("d", d3.linkHorizontal()
                                .x(d => d.y)
                                .y(d => d.x))
                    }),
                (exit) =>
                    exit
                        .transition()
                        .duration(700)
                        .attr("d", d3.linkHorizontal()
                            .x(source.y)
                            .y(source.x)
                        )
                        .remove()
            )

        /**
         *  Upon clicking a node (d), we toggle its children and trigger a re-render of both charts. 
         */
        function click(_, d) {
            // toggle children
            if (d.children) {
                d._children = d.children
                d.children = null
            } else {
                d.children = d._children
                d._children = null
            }

            // we update the source to show where the change originates
            source = d

            selection.call(my)
            treemapSelection.call(treemap)
        }

        /** 
         * Updates the circle's attributes for each node in the nodes parameteri
         * 
         * nodes is a selection of nodes
         */
        function updateCircle(nodes) {
            nodes
                .attr("fill", d => d === root ? '#ccc' : colorScale(d.value))
                .attr('stroke', '#1c1c1c')
                .attr('stroke-width', 1.5)
                .attr("r", d => d._children ? 9 : 6)
        }

        /**
         * Updates the text label for each node in the nodes parameter
         *
         * nodes is a selection of nodes
         */
        function updateText(nodes) {
            nodes
                .attr("dy", "0.32em")
                .attr("x", d => d.children || d._children ? -12 : 10)
                .attr("text-anchor", d => d.children || d._children ? "end" : "start")
                .attr("paint-order", "stroke")
                .attr("stroke", '#fff')
                .attr("stroke-width", 3)
                .attr('opacity', 1)
                .text(d => d.data.name)
        }

    }

    my.root = function (_) {
        return arguments.length ? (root = _, my) : root
    }
    my.setRoot = function (_) {
        return arguments.length ? (setRoot = _, my) : setRoot
    }
    my.dimensions = function (_) {
        return arguments.length ? (dimensions = _, my) : dimensions
    }
    my.source = function (_) {
        return arguments.length ? (source = _, my) : source
    }
    my.hover = function (_) {
        return arguments.length ? (hover = _, my) : hover
    }
    my.exit = function (_) {
        return arguments.length ? (exit = _, my) : exit
    }
    my.treemap = function (_) {
        return arguments.length ? (treemap = _, my) : treemap
    }
    my.treemapSelection = function (_) {
        return arguments.length ? (treemapSelection = _, my) : treemapSelection
    }
    my.colorScale = function (_) {
        return arguments.length ? (colorScale = _, my) : colorScale
    }

    return my
}
