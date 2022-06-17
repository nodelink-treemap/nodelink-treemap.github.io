import { useState, useEffect } from 'react'

import Panels from './components/Panels'

import * as d3 from 'd3'

import './App.css'

function App() {
  const datasets = [
    'animals',
    'flare',
    'sp500',
    'orchestras',
  ]

  const [data, setData] = useState({
    flare: undefined,
    animals: undefined,
    sp500: undefined,
    orchestras: undefined,
  })

  const [currentData, setCurrentData] = useState(undefined)

  // on load, get csv files
  useEffect(() => {

    async function fetch() {
      let flareData = await d3.json('/flare.json')
      let animalData = await d3.json('/animals.json')
      let sp500Data = await d3.json('/sp500.json')
      let orchestrasData = await d3.json('/orchestras.json')

      const newData = { 
        flare: { data: flareData, value: d => d.size },
        animals: { data: animalData, value: d => d.species },
        sp500: { data: sp500Data, value: d => d.marketcap },
        orchestras: { data: orchestrasData, value: d => d.number },
      }
      setData(newData)
      setCurrentData(newData.animals)
    }
    fetch()

  }, [])

  const handleChange = (event) => {
    const value = event.target.value;
    setCurrentData(data[value])
  }
  
  return (
    <div className="app">
      <div className='topWrapper'>
        <select onChange={handleChange}>
          {datasets.map((d, i) => <option key={i} value={d}>{d}</option>)}
        </select>

        <h1>Welcome to nodelink-treemap</h1>

        {/* disabled dropdown for even spacing */}
        <select disabled="disabled">
        {datasets.map((d, i) => <option key={i} value={d}>{d}</option>)}
        </select>
      </div>
      <Panels data={currentData && currentData.data} value={currentData && currentData.value}/>  
    </div>
  )
}

export default App
