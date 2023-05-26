<template>
    <h1 :class="titleClass">{{message}}</h1>
    <!-- <div class="card-body">Total vue packages: {{totalVuePackages}}</div> -->
    <div class="card-body">Dataset-packages found on server: {{this.datasets}}</div>
    <div style="background-color:DodgerBlue;">Selected dataset: {{this.selectedDataset}} </div>

    <h3>Available datasets</h3>

    <ul v-if="this.datasets != null && this.datasets.length > 0">
        <p v-for="d in this.datasets">
        <li style="color:blue;font-size:12px">
            <input @change="onChange($event)" type="radio" name="datasets" :value="d">
            <span style="padding-left: 10px">{{   d   }}</span>
        </li>
        </p>
    </ul>
    <br>
    <br>

    <button v-on:click="loadDataset()">Load Selected Dataset</button>
    <button v-on:click="checkLoadingSize()">Check Loading progress</button>
    <h3>Store Quad Count: {{ quadCount }} Loading Complete: {{ doneLoading }}</h3>

    <h2 :class="loadedClass" v-if="doneLoading == 1">Dataset LOADED Successfully</h2>
    <br>

    <button v-on:click="getObservations()">Get observation subjects</button>
    <button v-on:click="sortObservations()">Sort observation subjects</button>
    <button v-on:click="submitNextObservation()">Submit next observation</button>
    <button v-on:click="submitRemainingObservations()">Submit remaining observations</button>
	<button v-on:click="startReplay()">Start real-time replay</button>
	<button v-on:click="stopReplay()">Stop real-time replay</button>


    <h3>Observations ({{ observationCount }}) - Showing max. 20 (first 10 and last 10)</h3>

    <ul v-if="doneLoading == 1">
        <p v-for="m in this.observationSubjects">
            <ul>
                {{ m.value }}
            </ul>
        </p>
    </ul>
    <br />
    <h2>Replay</h2>

    Current pointer position: {{ this.currentPointerPosition }} Timeout until next replay: {{ this.currentTimeout }} ms. Last update: {{ this.lastupdate }}
	<br />
	Running: {{this.running }}

</template>

<script>
	console.log(import.meta.env.VITE_APP_ENGINE)
    import ChildComponent from "./childComponent.vue";
    import { ref } from "vue"
    let id = 0

    export default {
        name: "ParentComponent",
        components: {
            ChildComponent
        },
        errorCaptured: function (err) { },
        mounted() {
            let n3Script = document.createElement('script')
            n3Script.setAttribute('src', 'https://unpkg.com/n3/browser/n3.min.js')
            document.head.appendChild(n3Script)

            this.checkLoadingSize();
            this.checkObservationCount();
			this.checkPointerPosition();
            //this.pollInterval = setInterval(this.checkLoadingSize(), 10000);
            //console.log(this.pollInterval);
        },
        setup() {
            const title = ref("");
            title.loaded = false;
            const changeTitle = (newTitle) => {
                let self = this;
                console.log("fire 11")
                console.log(newTitle)
                title.value = newTitle;
                title.loaded = true;
                // console.log(title.value.getQuads(null, null, null, null))
                let qs = title.value.getQuads(null, null, null, null);
                console.log(qs);
                title.observations = [];
                for (let i = 0; i < qs.length; i++) {
                    if (qs[i].predicate.value == 'https://saref.etsi.org/core/measurementMadeBy') {
                        console.log(qs[i]);
                        title.observations.push(qs[i]);
                    }
                }
                console.log(title.observations.length);
                console.log(title.observations);
                console.log(title.loaded);
            };
            return { title, changeTitle };
        },
        data() {
            return {
                titleClass: 'title',
                loadedClass: 'loaded',
                message: '[SolidLab] This is the replay front-end for the Challange 82/83 demo (24/05) - v2.0.2',
                //submessage: 'This is based on the Vue.js tutorial from https://vuejs.org/tutorial/',
                submessage: '',
                observations: '',
                index: 0,
                totalVuePackages: null,
                datasets: null,
                selectedDataset: '',
                quadCount: 0,
                observationCount: 0,
                pollInterval: 10,
                doneLoading: 0,
                observationSubjects: null,
                currentPointerPosition: 0,
				currentTimeout: 0,
				running: false,
                sortedObservationSubjects: null,
				lastupdate: ""
            }
        },
        created() {
            // Simple GET request using fetch
            fetch("https://api.npms.io/v2/search?q=vue")
                .then(response => response.json())
                .then(data => (this.totalVuePackages = data.total));

            const getData = async () => {
                const res = await fetch(import.meta.env.VITE_APP_ENGINE+"/datasets/");
                const data = await res.json();
                this.datasets = data;
                console.log(this.datasets);
                return data;
            };

            getData();
        },
        methods: {
            submitRemainingObservations() {
                console.log("BUTTON REMAINING PRESSED");
                const pushPointer = async () => {
                    console.log("Loading "+import.meta.env.VITE_APP_ENGINE+"/advanceAndPushObservationPointerToTheEnd");
                    const res = await fetch(import.meta.env.VITE_APP_ENGINE+"/advanceAndPushObservationPointerToTheEnd");
                    const data = await res.json();
                    console.log("REMAINING REPLAYES");
                    console.log(data);
                    this.currentPointerPosition = data[0];
                    console.log("CURRENT POSTITION: " + this.currentPointerPosition);
                };

                pushPointer();
            },

            submitNextObservation() {
                console.log("BUTTON PRESSED");
                const pushPointer = async () => {
                    console.log("Loading "+import.meta.env.VITE_APP_ENGINE+"/advanceAndPushObservationPointer");
                    const res = await fetch(import.meta.env.VITE_APP_ENGINE+"/advanceAndPushObservationPointer");
                    const data = await res.json();
                    console.log("POINTER POSITION");
                    console.log(data);
                    this.currentPointerPosition = data[0];
                };

                pushPointer();
            },

            runEventSource() {
                let session;
            },

            onChange(event) {
                var data = event.target.value;
                this.selectedDataset = data;
                // console.log(event.target.value);
                // console.log(data);
            },

            loadDataset() {
                const getData = async () => {
                    console.log("Loading "+import.meta.env.VITE_APP_ENGINE+"/loadDataset?dataset=" + this.selectedDataset);
                    const res = await fetch(import.meta.env.VITE_APP_ENGINE+"/loadDataset?dataset=" + this.selectedDataset);
                    const data = await res.json();
                    console.log(data);
                };

                getData();
            },

            checkLoadingSize: function () {
                console.log(this.doneLoading);
                const getData = async () => {
                    console.log("Checking "+import.meta.env.VITE_APP_ENGINE+"/checkLoadingSize");
                    const res = await fetch(import.meta.env.VITE_APP_ENGINE+"/checkLoadingSize");
                    const data = await res.json();
                    console.log(data);
                    if (this.quadCount != 0 && this.quadCount == data[0]) {
                        this.doneLoading = 1;
                        console.log("Marking loading complete!");
                        console.log(this.doneLoading);
                    }
                    this.quadCount = data[0];
                    setTimeout(this.checkLoadingSize, 5000);
                };

                getData();

            },

            checkObservationCount: function () {
                const getObservations = async () => {
                    console.log("Checking "+import.meta.env.VITE_APP_ENGINE+"/checkObservationCount");
                    const res = await fetch(import.meta.env.VITE_APP_ENGINE+"/checkObservationCount");
                    const data = await res.json();
                    console.log(data);
                    this.observationCount = data[0];
                    setTimeout(this.checkObservationCount, 5000);
                };

                getObservations();
            },
			
            checkPointerPosition: function () {
                const getPointerPosition = async () => {
                    console.log("Checking "+import.meta.env.VITE_APP_ENGINE+"/checkPointerPosition");
                    const res = await fetch(import.meta.env.VITE_APP_ENGINE+"/checkPointerPosition");
                    const data = await res.json();
                    console.log(data);
					if (this.currentPointerPosition != data[0]) {
						const today = new Date();
						const time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
						this.lastupdate = time;
					}					
                    this.currentPointerPosition = data[0]["pointer"];
					this.currentTimeout = data[1]["timeout"];
					
                    setTimeout(this.checkPointerPosition, 5000);
                };

                getPointerPosition();
            },			

            getObservations: function () {
                const getObservationSubjects = async () => {
                    console.log("Checking "+import.meta.env.VITE_APP_ENGINE+"/getObservations");
                    const res = await fetch(import.meta.env.VITE_APP_ENGINE+"/getObservations");
                    const data = await res.json();
                    console.log(data);
                    this.observationSubjects = data;
                };

                getObservationSubjects();
            },

            sortObservations: function () {
                const sortObservationSubjects = async () => {
                    console.log("Checking "+import.meta.env.VITE_APP_ENGINE+"/sortObservations");
                    const res = await fetch(import.meta.env.VITE_APP_ENGINE+"/sortObservations");
                    const data = await res.json();
                    console.log(data);
                    this.sortedObservationSubjects = data;
                };

                sortObservationSubjects();
            },
			
            startReplay: function () {
                const startReplayConst = async () => {
                    console.log("Checking "+import.meta.env.VITE_APP_ENGINE+"/startAutoPlay");
                    const res = await fetch(import.meta.env.VITE_APP_ENGINE+"/startAutoPlay");
                    const data = await res.json();
                    console.log(data);
                };
				
				this.running = true;
                startReplayConst();
            },

            stopReplay: function () {
                const stopReplayConst = async () => {
                    console.log("Checking "+import.meta.env.VITE_APP_ENGINE+"/stopAutoPlay");
                    const res = await fetch(import.meta.env.VITE_APP_ENGINE+"/stopAutoPlay");
                    const data = await res.json();
                    console.log(data);
                };

				this.running = false;
                stopReplayConst();
            }

			
        }
    };
</script>

<style>
    .loaded {
        color: green;
    }
</style>
