import * as d3 from 'd3'
import { hierarchy, tree } from 'd3'

export const nodelink = () => {
    let data,
        dimensions

    const my = (selection) => {

        let { width, height, margin } = dimensions

        if (data === undefined) return

        // for generating node ids
        let i = 0;

        const root = d3.hierarchy(data)
        update(root, root)

        function update(root, source) {

            // Compute the layout.
            const dx = 15;
            const dy = width / (root.height + 1);
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
                .attr("style", "max-width: 100%; height: auto; height: intrinsic;")
                .attr("font-family", "sans-serif")
                .attr("font-size", 16)
                .attr("width", width)
                .attr("height", height)

            svg.transition()
                .duration(700)
                .ease(d3.easeSin)
                // .delay(700)
                .attr("viewBox", [-dy * 1 / 3, x0 - dx, width, treeHeight])

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
                            .attr('transform', d => `translate(${source.y},${source.x})`)
                            .on('click', click)

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
                .attr("stroke-width", 1.5)
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

        }

        function updateCircle(nodes) {
            nodes
                .attr("fill", d => d._children ? 'lightsteelblue' : '#fff')
                .attr('stroke', '#1c1c1c')
                .attr('stroke-width', 1.5)
                .attr("r", d => d._children ? 5 : 4)
        }

        function updateText(nodes) {
            nodes
                .attr("dy", "0.32em")
                .attr("x", d => d.children || d._children ? -10 : 6)
                .attr("text-anchor", d => d.children || d._children ? "end" : "start")
                .attr("paint-order", "stroke")
                .attr("stroke", '#fff')
                .attr("stroke-width", 3)
                .attr('opacity', 1)
                .text(d => d.data.name)
        }

        function click(_, d) {

            if (d.children) {
                d._children = d.children
                d.children = null
            } else {
                d.children = d._children
                d._children = null
            }
            update(root, d)
        }

    }

    my.data = function (_) {
        return arguments.length ? (data = _, my) : data;
    }
    my.dimensions = function (_) {
        return arguments.length ? (dimensions = _, my) : dimensions;
    }

    return my
}