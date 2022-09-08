let histogram;
let ctx;
let canvas;
const randomSize = 15

const showBtn = document.getElementById("show");
const resetBtn = document.getElementById("reset");
const updateBtn = document.getElementById("update");


window.onload = function (){
    canvas = document.getElementById("histogram");
    ctx = canvas.getContext("2d");

    const dpr = window.devicePixelRatio;
    const rect = canvas.getBoundingClientRect();

    // Set the "actual" size of the canvas
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    // Scale the context to ensure correct drawing operations
    ctx.scale(dpr, dpr);

    // Set the "drawn" size of the canvas
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const randomNums = generateRandomDataset(randomSize)
    histogram = new Histogram(ctx, randomNums , canvas.width, canvas.height);
    histogram.drawAxisLines();
    histogram.drawAllBars();
}


window.addEventListener('resize', () => {
    canvas = document.getElementById("histogram");
    ctx = canvas.getContext("2d");

    const dpr = window.devicePixelRatio;
    const rect = canvas.getBoundingClientRect();

    // Set the "actual" size of the canvas
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    // Scale the context to ensure correct drawing operations
    ctx.scale(dpr, dpr);

    // Set the "drawn" size of the canvas
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    histogram.updateCanvasSize(canvas.width, canvas.height);
    histogram.drawAllBars();
});


updateBtn.addEventListener('click', () => {
    const userInput = document.getElementById("input").value;

    if (userInput.length > 0){
        const userInputArray = userInput.split(',').map(Number);

        histogram.updateDatasetAndDataFrequency(userInputArray);
        histogram.drawAllBars();
        document.getElementById("input").value = "";
    }
});

showBtn.addEventListener('click', () => {
    const userInput = document.getElementById("input").value;

    if (userInput.length > 0){
        const data =  userInput.split(',').map(Number);

        histogram = new Histogram(ctx, data, canvas.width, canvas.height);

        histogram.drawAllBars();
        document.getElementById("input").value = "";
    }
});


resetBtn.addEventListener('click', () => {
    histogram.clearCanvas();
    histogram.clearDataset();
    histogram.drawAxisLines();
    document.getElementById("input").value = "";
});


function generateRandomDataset(datasetSize)
{
    const dataArray = [];
    for (let i = 0; i < datasetSize; i++) {
        const rand = Math.random();
        dataArray.push(rand < 0.5 ? -Math.random()*101: Math.random()*101);
    }
    return dataArray
}


class Histogram {

    yAxisBinsCount = 10;

    axisLinesWidth = 10;
    canvasWidthOffset = 150;

    yAxisOffsetFromCanvasXOrigin = 95;
    xAxisOffsetFromCanvasHeight = 95;

    barOffsetFromCanvasOrigin = 10;
    barOffsetFromXAxis = this.xAxisOffsetFromCanvasHeight + this.axisLinesWidth;
    barOffsetFromYAxis = this.yAxisOffsetFromCanvasXOrigin + this.axisLinesWidth;


    #ctx;
    #canvasWidthVal;
    #canvasHeightVal;

    #dataFrequency;
    #dataFrequencyMax;
    #dataFrequencyMin;

    #dataset;
    #datasetMin;
    #datasetMax;

    #maxBinIndex = 0;

    constructor(ctx, dataset, canvasWidth, canvasHeight) {
        this.#ctx = ctx;
        this.#dataset = dataset;
        this.#canvasWidthVal = canvasWidth-this.canvasWidthOffset;
        this.#canvasHeightVal = canvasHeight;
        this.#datasetMin = Math.min(...this.#dataset);
        this.#datasetMax = Math.max(...this.#dataset);

        this.calculateFrequency();
        this.#updateDataFrequencyMinValue(Math.min(...this.#dataFrequency));
        this.#updateDataFrequencyMaxValue(Math.max(...this.#dataFrequency));
    }

    drawAllBars()
    {
        this.clearCanvas();
        if(this.#datasetSize() === 0){
            return;
        }

        this.drawAxisLines();
        this.#drawYAxisLabels();
        this.#drawXAxisLabels();

        let x = this.barOffsetFromYAxis;

        for (let binNum = 0; binNum < this.#dataFrequencySize(); binNum++) {
            const canvasHeightWithOffset =
                this.#canvasHeight() - this.barOffsetFromXAxis - this.barOffsetFromCanvasOrigin;

            const barHeight =
                (this.#dataFrequency[binNum]/this.#dataFrequencyMax) * (canvasHeightWithOffset);

            this.#selectBinRandomColor(binNum, barHeight);

            this.#drawOneBar(
                x,
                canvasHeightWithOffset - barHeight + this.barOffsetFromCanvasOrigin,
                this.#barsWidth(),
                barHeight);

            x += this.#barsWidth();
        }

    }

    calculateFrequency()
    {
        const n = this.#datasetSize()

        //The Rice Rule is presented as a simple alternative to Sturges' rule.
        let allBarsCount = Math.ceil(2 * Math.cbrt(n));

        let range = this.#datasetMaxValue() - this.#datasetMinValue();
        if(range === 0){
            range = 1;
        }

        let binWidth = range/allBarsCount;

        this.#maxBinIndex =
            Math.floor((this.#datasetMaxValue() - this.#datasetMinValue() ) / binWidth);

        const dataFrequencyMap = new Map();

        // let maxBinIndex = 0;
        for (let i = 0; i < this.#datasetSize(); i++) {
            let binIndex =
                Math.floor((this.#dataset[i] - this.#datasetMinValue() ) / binWidth);
            // if (maxBinIndex < binIndex){
            //     maxBinIndex = binIndex
            // }
            if(dataFrequencyMap.has(binIndex)){
                const val = dataFrequencyMap.get(binIndex) + 1;
                dataFrequencyMap.set(binIndex, val);
            }
            else {
                dataFrequencyMap.set(binIndex, 1);
            }

        }

        this.#dataFrequency = Array(this.#maxBinIndex + 1).fill(0);

        for(let i = 0; i <= this.#maxBinIndex; i++ ){
            if(dataFrequencyMap.has(i)){
                this.#dataFrequency[i] = dataFrequencyMap.get(i);
            }else{
                this.#dataFrequency[i] = 0;
            }
        }

    }


    updateDatasetAndDataFrequency(newDataset)
    {
        this.#dataset = this.#dataset.concat(...newDataset);
        this.#updateDatasetMaxValue(Math.max(...this.#dataset))
        this.#updateDatasetMinValue(Math.min(...this.#dataset));

        this.calculateFrequency();
        this.#updateDataFrequencyMinValue(Math.min(...this.#dataFrequency ));
        this.#updateDataFrequencyMaxValue(Math.max(...this.#dataFrequency ));
    }


    clearCanvas()
    {
        this.#ctx.clearRect(
            0,
            0,
            this.#canvasWidth() + this.canvasWidthOffset,
            this.#canvasHeight());
    }


    clearDataset(){
        this.#dataset = [];
    }


    drawXAxis(){
        this.#drawOneBar(
            this.barOffsetFromXAxis,
            this.#canvasHeight() - this.barOffsetFromYAxis,
            this.#canvasWidth(),
            this.axisLinesWidth);
    }


    drawYaxis(){
        this.#drawOneBar(
            this.yAxisOffsetFromCanvasXOrigin,
            this.barOffsetFromCanvasOrigin,
            this.axisLinesWidth,
            this.#canvasHeight() - this.barOffsetFromYAxis
        );
    }


    drawAxisLines()
    {
        ctx.fillStyle = '#7f71fe';
        this.drawXAxis()
        this.drawYaxis()
    }


    #datasetSize()
    {
        return this.#dataset.length;
    }


    #datasetMaxValue()
    {
        return this.#datasetMax;
    }


    #datasetMinValue()
    {
        return this.#datasetMin;
    }


    #updateDatasetMaxValue(max)
    {
        this.#datasetMax = max;
    }


    #updateDatasetMinValue(min)
    {
        this.#datasetMin = min;
    }


    #dataFrequencySize()
    {
        return this.#dataFrequency.length;
    }


    #dataFrequencyMaxValue()
    {
        return this.#dataFrequencyMax;
    }


    #updateDataFrequencyMaxValue(max)
    {
        this.#dataFrequencyMax = max;
    }


    #updateDataFrequencyMinValue(min)
    {
        this.#dataFrequencyMin = min;
    }


    updateCanvasSize(width, height)
    {
        this.#canvasWidthVal = width - this.canvasWidthOffset;
        this.#canvasHeightVal = height;
    }


    #canvasWidth(){
        return this.#canvasWidthVal;
    }


    #canvasHeight(){
        return this.#canvasHeightVal;
    }


    #drawOneBar(StartXCoordinate, startYCoordinate, barWidth, barHeight)
    {
        this.#ctx.fillRect(StartXCoordinate, startYCoordinate, barWidth, barHeight);
    }


    #selectBinRandomColor()
    {
        const red = 255*Math.random()|0;
        const green = 255*Math.random()|0;
        const blue = 255*Math.random()|0;

        this.#ctx.fillStyle = "rgb(" + red + "," + green + "," + blue + ")";
    }


    #drawXAxisLabels()
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
        for (let binNum = 0; binNum <= this.#dataFrequencySize(); binNum++) {
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


    #drawYAxisLabels()
    {
        ctx.fillStyle = "white";
        ctx.font = '25px Arial';

        let yValue = 0;
        let valueStepSize = this.#dataFrequencyMaxValue() / this.yAxisBinsCount;

        let yPosition = this.#canvasHeight() - this.barOffsetFromXAxis;
        let positionStepSize =
            (yPosition - this.barOffsetFromCanvasOrigin) / this.yAxisBinsCount;

        for(let i = 0; i <= this.yAxisBinsCount; i++){
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


    #barsWidth(){
        return (this.#canvasWidth()-this.barOffsetFromYAxis) / this.#dataFrequencySize();
    }

}

