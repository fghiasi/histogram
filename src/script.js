let histogram;
let ctx;
let canvas;
const randomSize = 15

const showBtn = document.getElementById("show");
const resetBtn = document.getElementById("reset");
const updateBtn = document.getElementById("update");

// Runs after html and css are loaded
window.onload = function (){
    canvas = document.getElementById("histogram");
    ctx = canvas.getContext("2d");

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const randomNums = generateRandomDataset(randomSize)
    histogram = new Histogram(ctx, randomNums , canvas.width, canvas.height);
    histogram.drawAllBars();
}

// Resize event to make the screen responsive
window.addEventListener('resize', () => {
    canvas = document.getElementById("histogram");
    ctx = canvas.getContext("2d");

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    histogram.updateCanvasSize(canvas.width, canvas.height);
    histogram.drawAllBars();
});

// Update button event
updateBtn.addEventListener('click', () => {
    const userInput = document.getElementById("input").value;

    if (userInput.length > 0){
        const userInputArray = userInput.split(',').map(Number);

        histogram.updateDatasetAndDataFrequency(userInputArray);
        histogram.drawAllBars();
        document.getElementById("input").value = "";
    }
});

// Show button event
showBtn.addEventListener('click', () => {
    const userInput = document.getElementById("input").value;

    if (userInput.length > 0){
        const data =  userInput.split(',').map(Number);

        histogram = new Histogram(ctx, data, canvas.width, canvas.height);

        histogram.drawAllBars();
        document.getElementById("input").value = "";
    }
});

// Reset button event
resetBtn.addEventListener('click', () => {
    histogram.clearCanvas();
    histogram.clearDataset();
    histogram.drawAxisLines();
    document.getElementById("input").value = "";
});

// Helper to generate random numbers for home page
function generateRandomDataset(datasetSize)
{
    const dataArray = [];
    for (let i = 0; i < datasetSize; i++) {
        const rand = Math.random();
        dataArray.push(rand < 0.5 ? -Math.random()*101: Math.random()*101);
    }
    return dataArray
}

// Histogram interface
class Histogram {

    yAxisLineCount = 10;

    // Both x and y axis line width
    axisLinesWidth = 10;
    canvasWidthOffset = 150;

    yAxisOffsetFromCanvasXOrigin = 95;
    xAxisOffsetFromCanvasHeight = 95;

    barOffsetFromCanvasOrigin = 10;
    barOffsetFromXAxis = this.xAxisOffsetFromCanvasHeight + this.axisLinesWidth;
    barOffsetFromYAxis = this.yAxisOffsetFromCanvasXOrigin + this.axisLinesWidth;

    // Canvas context
    #ctx;
    #canvasWidthVal;
    #canvasHeightVal;

    // Sorted Array Data Structure for computing frequencies.
    #dataFrequency;
    #dataFrequencyMax;
    #dataFrequencyMin;

    // Array Data Structure for user input.
    #dataset;
    #datasetMin;
    #datasetMax;

    #maxBinIndex = 0;

    constructor(ctx, dataset, canvasWidth, canvasHeight) {
        this.#ctx = ctx;
        this.#canvasWidthVal = canvasWidth-this.canvasWidthOffset;
        this.#canvasHeightVal = canvasHeight;

        this.#dataset = dataset;
        this.#updateDatasetMaxValue(Math.max(...this.#dataset));
        this.#updateDatasetMinValue(Math.min(...this.#dataset));

        this.#dataFrequency = this.computeFrequency();
        this.#updateDataFrequencyMinValue(Math.min(...this.#dataFrequency));
        this.#updateDataFrequencyMaxValue(Math.max(...this.#dataFrequency));
    }

    // General Interface to draw bars.
    drawAllBars()
    {
        this.clearCanvas();
        if(this.#datasetSize() === 0){
            return;
        }

        // draw axis lines and numbers
        this.drawAxisLines();
        this.drawAxisNumbers();

        let x = this.barOffsetFromYAxis;

        // Iterate from 0 to dataFrequency size that is the number of bars in Canvas.
        for (let barNum = 0; barNum < this.#dataFrequencySize(); barNum++) {

            const canvasHeightWithOffset =
                this.#canvasHeight() - this.barOffsetFromXAxis - this.barOffsetFromCanvasOrigin;

            // Height of each bar relative to max frequency and Canvas height with offsets
            const barHeight =
                (this.#dataFrequency[barNum]/this.#dataFrequencyMax) * (canvasHeightWithOffset);

            // Select random color for each bin
            this.#selectBinRandomColor();

            // Draw one bar.
            this.#drawOneBar(
                x,
                canvasHeightWithOffset - barHeight + this.barOffsetFromCanvasOrigin,
                this.#barsWidth(),
                barHeight);

            x += this.#barsWidth();
        }

    }

    // Updates the dataset and frequency data as well as min and max values.
    updateDatasetAndDataFrequency(newDatasetArray)
    {
        this.#dataset = this.#dataset.concat(...newDatasetArray);
        this.#updateDatasetMaxValue(Math.max(...this.#dataset));
        this.#updateDatasetMinValue(Math.min(...this.#dataset));

        this.#dataFrequency = this.computeFrequency();
        this.#updateDataFrequencyMinValue(Math.min(...this.#dataFrequency ));
        this.#updateDataFrequencyMaxValue(Math.max(...this.#dataFrequency ));
    }

    // Computes frequency using Rice Rule
    computeFrequency()
    {
        const n = this.#datasetSize()

        // The Rice Rule
        let allBarsCount = Math.ceil(2 * Math.cbrt(n));

        let range = this.#datasetMaxValue() - this.#datasetMinValue();
        // To ensure there be one bar if input is only a single value
        if(range === 0){
            range = 1;
        }

        let binWidth = range/allBarsCount;

        this.#maxBinIndex =
            Math.floor((this.#datasetMaxValue() - this.#datasetMinValue() ) / binWidth);

        const dataFrequencyMap = new Map();

        for (let i = 0; i < this.#datasetSize(); i++) {
            let binIndex =
                Math.floor((this.#dataset[i] - this.#datasetMinValue() ) / binWidth);

            if(dataFrequencyMap.has(binIndex)){
                const val = dataFrequencyMap.get(binIndex) + 1;
                dataFrequencyMap.set(binIndex, val);
            }
            else {
                dataFrequencyMap.set(binIndex, 1);
            }

        }

        const dataFrequency = Array(this.#maxBinIndex + 1).fill(0);

        for(let i = 0; i <= this.#maxBinIndex; i++ ){
            if(dataFrequencyMap.has(i)){
                dataFrequency[i] = dataFrequencyMap.get(i);
            }else{
                dataFrequency[i] = 0;
            }
        }

        return dataFrequency

    }

    // Clears Canvas
    clearCanvas()
    {
        this.#ctx.clearRect(
            0,
            0,
            this.#canvasWidth() + this.canvasWidthOffset,
            this.#canvasHeight());
    }

    // Clears Dataset
    clearDataset(){
        this.#dataset = [];
    }

    // draws x-axis line
    drawXAxis(){
        this.#drawOneBar(
            this.barOffsetFromXAxis,
            this.#canvasHeight() - this.barOffsetFromYAxis,
            this.#canvasWidth(),
            this.axisLinesWidth);
    }

    // Draws y-axis line
    drawYaxis(){
        this.#drawOneBar(
            this.yAxisOffsetFromCanvasXOrigin,
            this.barOffsetFromCanvasOrigin,
            this.axisLinesWidth,
            this.#canvasHeight() - this.barOffsetFromYAxis
        );
    }

    // Draws both x and y axis
    drawAxisLines()
    {
        ctx.fillStyle = '#7f71fe';
        this.drawXAxis()
        this.drawYaxis()
    }

    // Draws both x and y axis numbers
    drawAxisNumbers(){
        this.#drawYAxisNumbers();
        this.#drawXAxisNumbers();
    }

    // get Array dataset size
    #datasetSize()
    {
        return this.#dataset.length;
    }

    // get Array dataset max value
    #datasetMaxValue()
    {
        return this.#datasetMax;
    }

    // get Array dataset min value
    #datasetMinValue()
    {
        return this.#datasetMin;
    }

    // Updates Array dataset max value
    #updateDatasetMaxValue(max)
    {
        this.#datasetMax = max;
    }

    // Updates Array dataset min value
    #updateDatasetMinValue(min)
    {
        this.#datasetMin = min;
    }

    // Get Sorted Array frequency data min value
    #dataFrequencySize()
    {
        return this.#dataFrequency.length;
    }

    // Get Sorted Array frequency data max value
    #dataFrequencyMaxValue()
    {
        return this.#dataFrequencyMax;
    }

    // Updates Sorted Array frequency data max value
    #updateDataFrequencyMaxValue(max)
    {
        this.#dataFrequencyMax = max;
    }

    // Updates Sorted Array frequency data min value
    #updateDataFrequencyMinValue(min)
    {
        this.#dataFrequencyMin = min;
    }

    // Updates Canvas Width and Height
    updateCanvasSize(width, height)
    {
        this.#canvasWidthVal = width - this.canvasWidthOffset;
        this.#canvasHeightVal = height;
    }

    // Get Canvas Width
    #canvasWidth(){
        return this.#canvasWidthVal;
    }

    // Get Canvas Height
    #canvasHeight(){
        return this.#canvasHeightVal;
    }

    // Draws a rectangle
    #drawOneBar(StartXCoordinate, startYCoordinate, barWidth, barHeight)
    {
        this.#ctx.fillRect(StartXCoordinate, startYCoordinate, barWidth, barHeight);
    }

    // Randomly selects a number and applies to Canvas Context
    #selectBinRandomColor()
    {
        const red = 255*Math.random()|0;
        const green = 255*Math.random()|0;
        const blue = 255*Math.random()|0;

        this.#ctx.fillStyle = "rgb(" + red + "," + green + "," + blue + ")";
    }

    // Draws x axis numbers relative to Sorted Array data frequency size
    #drawXAxisNumbers()
    {
        ctx.fillStyle = "white";
        ctx.font = '1.7vw Arial';

        let xLabelValue = this.#datasetMinValue();
        let stepSize =
            (this.#datasetMaxValue() - this.#datasetMinValue())/this.#maxBinIndex;

        if((this.#datasetMax - this.#datasetMin) === 0){
            stepSize = 1;
        }

        let x = this.barOffsetFromYAxis;
        for (let barNum = 0; barNum <= this.#dataFrequencySize(); barNum++) {
            xLabelValue = Math.round(xLabelValue * 1000) / 1000;
            ctx.fillText(
                xLabelValue.toString(),
                x - 10,
                this.#canvasHeight() - this.xAxisOffsetFromCanvasHeight + 60,
                80);
            this.#drawOneBar(
                x,
                this.#canvasHeight() - this.xAxisOffsetFromCanvasHeight,
                4,
                15);
            xLabelValue += stepSize;
            x += this.#barsWidth();
        }
    }

    // Draw Y axis Numbers
    #drawYAxisNumbers()
    {
        ctx.fillStyle = "white";
        ctx.font = '25px Arial';

        let yValue = 0;
        let valueStepSize = this.#dataFrequencyMaxValue() / this.yAxisLineCount;

        let yPosition = this.#canvasHeight() - this.barOffsetFromXAxis;
        let positionStepSize =
            (yPosition - this.barOffsetFromCanvasOrigin) / this.yAxisLineCount;

        for(let i = 0; i <= this.yAxisLineCount; i++){
            yValue = Math.round(yValue * 100) / 100;
            ctx.fillText(yValue.toString(), 10 , yPosition + 10, 50);
            this.#drawOneBar(
                this.yAxisOffsetFromCanvasXOrigin - this.axisLinesWidth,
                yPosition,
                15,
                4);
            yPosition -= positionStepSize;
            yValue += valueStepSize;

        }
    }

    // Get bars width relative to Canvas width and Sorted Array data Frequency
    #barsWidth(){
        return (this.#canvasWidth()-this.barOffsetFromYAxis) / this.#dataFrequencySize();
    }

}

