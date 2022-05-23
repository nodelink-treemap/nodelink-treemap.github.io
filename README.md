# nodelink-treemap.github.io

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