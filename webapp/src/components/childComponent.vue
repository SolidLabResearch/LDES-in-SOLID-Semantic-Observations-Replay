<template>
  <input class="specificFile" type="file" @change="inputChangeFile($event)" />
</template>

<script>
import {ref} from "vue"
export default {

  name: "ChildComponent",

  setup(props, context) {
  
    const inputValue = ref("")    
    const inputChangeFile = (event)=> {
	  
	  console.log("LOADING")
	  const store = new N3.Store();
	  console.log("Created N3 Store");
	  //console.log(event);
	  const file = event.target.files[0];

	  let reader = new FileReader()
	  reader.readAsText(file)
	  
	  reader.onload = function() {
		this.dataResult = reader.result
		//console.log(this.dataResult)
		
		const parser = new N3.Parser();
		parser.parse(this.dataResult,
		  (error, quad, prefixes) => {
		  if (quad) {
			//console.log(quad);
			store.add(quad) 
			//this.quadCount++;
			//console.log(this.quadCount)
		  }
		  else
			console.log("# That's all, folks!", prefixes);
			//console.log(store.countQuads());
			// Retrieve all quads
			// for (const quad of store)
			  // console.log(store.countQuads());			
			});
			
	  };	  

	  reader.onloadend = function() {
		this.store = store
	    console.log(this.store.countQuads())
		this.quadCount = store.countQuads()
		//console.log("UPDATED QUAD COUNT")
		console.log("DONE DONE (" + this.quadCount + ")")
		alert("Quad Count: " + this.quadCount); 
		console.log(this.store);
		context.emit("newValue", this.store);		
	  };
	  
	  reader.onerror = function() {
	    console.log(event)
	  };

	  
    };
    return {
      inputChangeFile,
      inputValue
    };

  },
  emits:["newValue"]
};
</script>