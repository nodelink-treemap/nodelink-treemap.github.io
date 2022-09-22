# nodelink-treemap.github.io

<p align="center">
  <img src="/public/nodelink-treemap-preview.png" alt="nodelink-treemap-preview"/>
</p>

> Developed by `Prof. Alark Joshi` and `Asst. Colm Lang`

This interactive visualization was developed for use within a Data Visualization Literacy user study. Herein we wish to demonstrate, through interactivity,
the connection between Nodelink Graphs and Treemaps.


## Approach

When approaching our main-goal, the necessity for simple data sharing and rendering was clear. For this reason, we chose to use React with D3 for this project.
Moreover, the [towards reusable charts paradigm](https://bost.ocks.org/mike/chart/) proved useful in its handling of the general update pattern and getter/setter
functions. This approach layed the groundwork for simple implementations of multiple datasets.

## Installation

1. Install and use the correct version of node using [NVM](https://github.com/nvm-sh/nvm)
    ```sh
    nvm install
    # and
    nvm use
    ```

2. Navigate to this project's directory
    ```sh
    cd path/to/nodelink-treemap
    ```

3. Install dependencies
    ```sh
    npm i
    ```

4. Start the development server
    ```sh
    npm run dev
    ```

## Building and Running for Production

1. Generate a full static production build

   ```sh
   npm run build
   ```

2. Preview the site as it will appear once deployed

   ```sh
   npm run preview
   ```
  
## Deploying to gh-pages
  Run the deployment script. As long as you are a contributer to this repository, the script will generate a build and deploy it to the gh-pages branch.

  ```sh
  sh deploy.sh
  ```
