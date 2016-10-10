const U = {

	touch: null,

	is_touch() {
		if ( U.touch === null ) {
			try {  
				document.createEvent("TouchEvent");
				return true;  
			} catch (e) {  
				return false;  
     		}  
		} else {
			return U.touch
		}
	}
}

export default U