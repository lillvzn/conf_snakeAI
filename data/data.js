const labels1 = [];

const data1 = {
  labels: labels1, // place labels array in correct spot
  datasets: [
    {
      type: 'scatter',
      backgroundColor: '#58508D',
      borderColor: '#58508D',
      data: [] // { x: 1, y: 36 }, { x: 2, y: 37 }, { x: 3, y: 40 }, { x: 4, y: 40 }
    },
    {
      type: 'line',
      label: 'Line Dataset',
      data: [], // { x: 5, y: 36 }, { x: 6, y: 37 }, { x: 7, y: 40 }, { x: 8, y: 40 }
      backgroundColor: '#0000FF',
      borderColor: '#0000FF',
      //xAxisID: 'x2' // Specify to which axes to link
    },
  ],
}

const cfg1 = {
  type: 'scatter',
  data: data1,
  options: {
    animation: { duration: 0 },
    scales: {
      x: {
        min: 0,
        max: 82,
        ticks: {
          stepSize: 2
        }
      },
      // x2: { // add extra axes
      //   position: 'bottom',
      //   type: 'category'
      // },
      y: {
        min: 0,
        max: 2000,
        ticks: {
          stepSize: 20
        },
      },
    },
    plugins: {
      legend: {
        display: false, // disabling for now...
        //position: 'top',
      },
      title: {
        display: true,
        text: ''
      }
    }
  }
};

const myChart = new Chart($("#theChart")[0].getContext('2d'), cfg1);

const generations = [];
let generationNum = 0;

let intervalID = -1;

function plotGeneration() {
  data1.datasets[0].data.length = 0;
  cfg1.options.plugins.title.text = `TOP-100 Best Fitness (x: score, y: frames alive). Generation: ${(generationNum % generations.length) * 10}`;
  for (let chromosome of generations[generationNum++ % generations.length]) {
    data1.datasets[0].data.push({ x: chromosome[1], y: chromosome[2] });
  }
  myChart.update();

  if (generationNum == generations.length) {
    clearInterval(intervalID);
    intervalID = -1;
  }
}

async function process() {
    let fileExist = true;

    while(fileExist) {
        let content;
        try {
            content = await $.get(`./nrsharip_20220724212126_upd3/nrsharip_gen${generationNum}.txt`).fail(function() {
                fileExist = false;
            }).promise();
        } catch (e) {
            fileExist = false;
        }

        if (!fileExist) { break; }

        let temp = [];
        for (let line of content.split("\r\n")) {
            temp.push(line.split(" "));
        }
        temp.pop(); // popping the extra new line;
        temp.sort((a, b) => a[5] - b[5]);
        generations.push(temp.slice(-100));
        
        generationNum += 10;
    }

    generationNum = 0;
    intervalID = setInterval(plotGeneration, 50);
}


window.thechart = data1;
$(document).ready(function (){
    process();
});