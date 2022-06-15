import * as d3 from 'd3'

export default function nodelink() {
    let root,
        setRoot,
        dimensions,
        source,
        hover,
        exit,
        i = -1,
        treemap,
        treemapSelection,
        colorScale

    const my = (selection) => {

        const { width, height } = dimensions

        root.sort((a, b) => a.data.name.localeCompare(b.data.name))

        // Compute the layout.
        const dx = 25;
        const dy = width / (root.height + 1.5);
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
            .attr("font-size", 15)
            .attr("width", width)
            .attr("height", height)

        svg.transition()
            .duration(700)
            .ease(d3.easeSin)
            .attr("viewBox", [-dy * 3 / 4, x0 - dx, width + dy / 2, treeHeight])

        svg.selectAll('.nodeG')
            .data([null])
            .join("g")
            .attr('class', 'nodeG')
            .selectAll("g")
            .data(root.descendants(), d => d.id || (d.id = ++i))
            .join(
                (enter) => {
                    const node = enter.append('g')
                        .attr('class', 'node')
                        .style('cursor', d => d.children || d._children ? 'pointer' : 'default')
                        .attr('transform', `translate(${source.y},${source.x})`)
                        .on('click', click)
                        .on('mouseover', hover)
                        .on('mouseout', exit)

                    node.transition()
                        .duration(700)
                        .attr("transform", d => `translate(${d.y},${d.x})`)

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

                    update.select('circle')
                        .call(updateCircle)

                    update.select('text')
                        .call(updateText)
                }),
                (exit) => {
                    exit
                        .transition()
                        .duration(700)
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

        function click(_, d) {

            // toggle children
            if (d.children) {
                d._children = d.children
                d.children = null
            } else {
                d.children = d._children
                d._children = null
            }

            source = d

            selection.call(my)
            treemapSelection.call(treemap)
        }
        // updates the circle for each node in the nodes parameter
        function updateCircle(nodes) {
            nodes
                .attr("fill", d => d === root ? '#ccc' : colorScale(d.value))
                .attr('stroke', '#1c1c1c')
                .attr('stroke-width', 1.5)
                .attr("r", d => d._children ? 10 : 7)
        }

        // updates the text label for each node in the nodes parameter
        function updateText(nodes) {
            nodes
                .attr("dy", "0.32em")
                .attr("x", d => d.children || d._children ? -13 : 10)
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