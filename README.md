<h2 align="center">A Simple Histogram Using Canvas.</h2>
<h3 align="center">By Farbod Ghiasi.</h3>

## 🔧 Technologies & Tools
![](https://img.shields.io/badge/OS-Ubuntu-informational?style=flat&logo=Ubuntu&logoColor=white&color=orange)
![](https://img.shields.io/badge/Editor-IntelliJ_IDEA-informational?style=flat&logo=PyCharm&logoColor=white&color=black)
![](https://img.shields.io/badge/FrontEnd-JavaScript-informational?style=flat&logo=JavaScript&logoColor=white&color=F7DF1E)
![](https://img.shields.io/badge/VS-GitHub-informational?style=flat&logo=JavaScript&logoColor=white&color=F05032)
## Running
#### Clone the repository or download index.html, style.css, and script.js all in one directory and then open the index.html file in your favorite browser.
## Description

This is a minimalistic and extensible [Canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial) API that renders a Histogram. It is written in JavaScript without dependency on third-party libraries.

## Features
* The histogram is accurate no more than 2 decimal on x-axis.
* It accepts positive and negative floating points as input up to any decimal points.
* The histogram generates dynamic numbers of bars based on [The Rice Rule](https://en.wikipedia.org/wiki/Histogram) is presented as a simple alternative to Sturges' rule.
* The Rice Rule dictates the number of bars to be floor(2 * cubic root of number of data points).
* It uses device pixel ratio to support screens with high DPI.
* It is responsive on smaller or larger screens.