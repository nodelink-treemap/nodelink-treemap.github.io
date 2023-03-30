import { useRef, useState, useEffect } from 'react'
import { legendColor } from 'd3-svg-legend'

import * as d3 from 'd3'

import './panels.css'
import nodelink from '../charts/nodelink'
import treemap from '../charts/treemap'

export const Colors = {
  blues: d3.interpolateBlues,
  greens: d3.interpolateGreens,
  greys: d3.interpolateGreys,
  oranges: d3.interpolateOranges,
  purples: d3.interpolatePurples,
  reds: d3.interpolateReds,
}

/**
 * Panels is a component that contains the nodelink and treemap charts
 */
export default function Panels({ data, value, format, color }) {
    const [root, setRoot] = useState()

    // we want each chart to be full height (below topbar) and half width
    const chartDimensions = {
        width: window.innerWidth / 2,
        height: window.innerHeight - 70,
        margin: {
            top: 20,
            right: 20,
            bottom: 20,
            left: 20
        }
    }
    
    // we instantiate the charts and chart refs
    const treemapRef = useRef(null),
        nodelinkRef = useRef(null),
        treemapChart = treemap(),
        nodelinkChart = nodelink()

    // we pass the shared hover and exit logic as well as a reference to the chart's neighbor
    treemapChart.dimensions(chartDimensions)
    .hover(hover)
    .exit(exit)
    .nodelink(nodelinkChart)
    .nodelinkSelection(d3.select(nodelinkRef.current))

    nodelinkChart.dimensions(chartDimensions)
    .setRoot(setRoot)
    .hover(hover)
    .exit(exit)
    .treemap(treemapChart)
    .treemapSelection(d3.select(treemapRef.current))
    
    // this use-effect is triggered when the underlying data changes (when a user changes the viewed dataset in the dropdown menu)
    useEffect(() => {
        if(!data) return

        // we clear the chart selections to create a blank slate (to prevent incorrectly attributed ids and keys)
        d3.select(nodelinkRef.current).selectAll('*').remove()
        d3.select(treemapRef.current).selectAll('*').remove()

        // now we get a tree structure from the data, sort it, and calculate the sum
        const _root = d3.hierarchy(data)
        _root.sort((a, b) => a.data.name.localeCompare(b.data.name))
        _root.sum(d => value(d) || 0)

        setRoot(_root)
    }, [data])
    
    // this use effect triggers a re-render when the root of the tree changes
    useEffect(() => {
        if(!root) return
        
        const colorScale = d3.scaleSequential(Colors[color])
        .domain(d3.extent(root.descendants().filter(d => d !== root), d => d.value))
          .nice()

        // color legend
        let legend = legendColor()
        .shapeWidth(75)
        .scale(colorScale)
        .labelFormat(d3.format('.2s'))
        .labels(({ i, generatedLabels }) => generatedLabels.at(i).replace('G', 'B')) // to keep format consistent to Currency, not Scientific
        .orient('horizontal')

        // svg legend
        let svgLegend = d3.select('.topWrapper').selectAll('.legendSVG')
        .data([null])
        .join('svg')
        .attr('class', 'legendSVG')
        .attr('width', 415)
        .attr('height', 150)

        svgLegend.selectAll('.legend')
        .data([null])
        .join('g')
        .attr('class', 'legend')
        .attr('transform', `translate(10,70)`)
        .call(legend)

        svgLegend.selectAll('rect')
        .style('stroke', 'black')

        const collapse = (node) => {
            if (node.children) {
                node._children = node.children
                node.children = null
                node._children.forEach(c => collapse(c))
            }
        }
        root.children.forEach(c => collapse(c))

        // now we update the charts with the new root and the new color scale from the computed data
        nodelinkChart.root(root)
        .source(root)
        .colorScale(colorScale)

        treemapChart.root(root)
        .treemapRoot(root)
        .colorScale(colorScale)

        // we update the format for correct labels
        if(format) {
            treemapChart.format(format)
        }

        // render
        let nodelinkRefElement = d3.select(nodelinkRef.current)
        nodelinkRefElement.selectAll('*').remove()
        nodelinkRefElement.call(nodelinkChart)

        let treemapRefElement = d3.select(treemapRef.current)
        treemapRefElement.selectAll('*').remove()
        treemapRefElement.call(treemapChart)

    }, [root, color])

    // we keep hover at this top level to share between both charts 
    function hover(_, node) {
        const ancestors = node.ancestors()
        const links = d3.selectAll('.linkG').selectAll('path')
        const rects = d3.selectAll('.treemapRectG').filter(d => d === node)

        links
        .classed('highlight', d => ancestors.includes(d.source) && ancestors.includes(d.target))

        // highlight the rect
        rects.selectAll('rect')
        .attr('visibility', 'visible')
        .classed('highlight', true)
    }

    function exit() {
        d3.selectAll('path')
        .classed('highlight', false)

        d3.selectAll('rect')
        .classed('highlight', false)
    }

    return (
        <div className="panels">
            <div className="nodelink">
                <svg ref={nodelinkRef}/>
            </div>
            <div className="treemap">
                <svg ref={treemapRef} />
            </div>
        </div>
    )
}




