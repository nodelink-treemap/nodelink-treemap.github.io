#!/usr/bin/env sh

# abort on errors
set -e

# build
npm run build

# navigate into the build output directory
cd dist

cp index.html treemap.html

git init
git checkout -b main
git add -A
git commit -m 'deploy'

git push -f git@github.com:nodelink-treemap/nodelink-treemap.github.io.git main:gh-pages

cd -

rm -rf dist
