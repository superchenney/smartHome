module.exports = {

	user:{
		name:{type:String,required:true},
		password:{type:String,required:true}
	},

	//chenney
	operate:{
		housename:{
			type: String,
			default: "客厅"
		},
		username:{
			type:String
		},
		operate:{
			type: String
		},
		date:{
			type:Date,
			default:Date.now()
			}
	},//操作记录


	wenshidu:{
		date:{
			type:Date,
			default:Date.now()
		},
		temperature:{
			type:String
		},
		humidity:{
			type:String
		},
	},	//温湿度

	guangZhao:{
		date:{
			type:Date,
			default:Date.now()
		},
		illumination:{
			type:Number
		},
	}

};
