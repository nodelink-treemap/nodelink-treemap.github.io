import { useRef, useState, useEffect, useReducer } from 'react'

import * as d3 from 'd3'

import './panels.css'
import nodelink from '../charts/nodelink'
import treemap from '../charts/treemap'

export default function Panels({ data, value }) {
    
    const [root, setRoot] = useState()



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
    

    
    const treemapRef = useRef(null)
    const treemapChart = treemap()
    .dimensions(chartDimensions)
    .hover(hover)
    .exit(exit)

    const nodelinkRef = useRef(null)
    const nodelinkChart = nodelink()
    .dimensions(chartDimensions)
    .setRoot(setRoot)
    .hover(hover)
    .exit(exit)
    .treemap(treemapChart)
    .treemapSelection(d3.select(treemapRef.current))
    
    useEffect(() => {
        if(!data) return

        d3.select(nodelinkRef.current).selectAll('*').remove()

        const _root = d3.hierarchy(data)

        _root.sort((a, b) => a.data.name.localeCompare(b.data.name))
        _root.sum(d => value(d) === undefined ? 0 : value(d))
        
        const collapse = (node) => {
            if (node.children) {
                node._children = node.children
                node.children = null
                node._children.forEach(c => collapse(c))
            }
        }
        _root.children.forEach(c => collapse(c))

        setRoot(_root)
    }, [data])
    
    useEffect(() => {
        if(!root) return
        
        const colorScale = d3.scaleSequential(d3.interpolateReds)
        .domain(d3.extent(root.descendants(), d => d.value))


        nodelinkChart.root(root)
        .source(root)
        .colorScale(colorScale)

        treemapChart.root(root)
        .treemapRoot(root)
        .colorScale(colorScale)

        // render
        let nodelinkRefElement = d3.select(nodelinkRef.current)
        nodelinkRefElement.call(nodelinkChart)

        let treremapRefElement = d3.select(treemapRef.current)
        treremapRefElement.call(treemapChart)

    }, [root])

    function hover(_, node) {

        const ancestors = node.ancestors()
        const links = d3.selectAll('.linkG').selectAll('path')
        const rects = d3.selectAll('.treemapRectG').filter(d => d === node)

        links
        .classed('highlight', d => ancestors.includes(d.source) && ancestors.includes(d.target))

        // first raise hovered rect and its label
        rects
        .raise()

        // then highlight the rect
        rects.selectAll('rect')
        .attr('visibility', 'visible')
        .classed('highlight', true)

    }

    function exit() {
        d3.selectAll('path')
        .classed('highlight', false)

        d3.selectAll('.treemapRectG')
        .filter(d => d.children)
        .lower()

        d3.selectAll('rect')
        .classed('highlight', false)
        // .attr('visibility', d => d.children ? 'hidden' : 'visible')
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




