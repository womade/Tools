(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.EBML=f()}})(function(){var define,module,exports;return(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});var tools_1=require("./tools");var int64_buffer_1=require("int64-buffer");var tools=require("./tools");var schema=require("matroska/lib/schema");var byEbmlID=schema.byEbmlID;var State;(function(State){State[State["STATE_TAG"]=1]="STATE_TAG";State[State["STATE_SIZE"]=2]="STATE_SIZE";State[State["STATE_CONTENT"]=3]="STATE_CONTENT";})(State||(State={}));var EBMLDecoder=(function(){function EBMLDecoder(){this._buffer=new tools_1.Buffer(0);this._tag_stack=[];this._state=State.STATE_TAG;this._cursor=0;this._total=0;this._schema=byEbmlID;this._result=[];}
EBMLDecoder.prototype.decode=function(chunk){this.readChunk(chunk);var diff=this._result;this._result=[];return diff;};EBMLDecoder.prototype.readChunk=function(chunk){this._buffer=tools.concat([this._buffer,new tools_1.Buffer(chunk)]);while(this._cursor<this._buffer.length){if(this._state===State.STATE_TAG&&!this.readTag()){break;}
if(this._state===State.STATE_SIZE&&!this.readSize()){break;}
if(this._state===State.STATE_CONTENT&&!this.readContent()){break;}}};EBMLDecoder.prototype.getSchemaInfo=function(tagNum){return this._schema[tagNum]||{name:"unknown",level:-1,type:"unknown",description:"unknown"};};EBMLDecoder.prototype.readTag=function(){if(this._cursor>=this._buffer.length){return false;}
var tag=tools_1.readVint(this._buffer,this._cursor);if(tag==null){return false;}
var buf=this._buffer.slice(this._cursor,this._cursor+tag.length);var tagNum=buf.reduce(function(o,v,i,arr){return o+v*Math.pow(16,2*(arr.length-1-i));},0);var schema=this.getSchemaInfo(tagNum);var tagObj={EBML_ID:tagNum.toString(16),schema:schema,type:schema.type,name:schema.name,level:schema.level,tagStart:this._total,tagEnd:this._total+tag.length,sizeStart:this._total+tag.length,sizeEnd:null,dataStart:null,dataEnd:null,dataSize:null,data:null};this._tag_stack.push(tagObj);this._cursor+=tag.length;this._total+=tag.length;this._state=State.STATE_SIZE;return true;};EBMLDecoder.prototype.readSize=function(){if(this._cursor>=this._buffer.length){return false;}
var size=tools_1.readVint(this._buffer,this._cursor);if(size==null){return false;}
var tagObj=this._tag_stack[this._tag_stack.length-1];tagObj.sizeEnd=tagObj.sizeStart+size.length;tagObj.dataStart=tagObj.sizeEnd;tagObj.dataSize=size.value;if(size.value===-1){tagObj.dataEnd=-1;if(tagObj.type==="m"){tagObj.unknownSize=true;}}
else{tagObj.dataEnd=tagObj.sizeEnd+size.value;}
this._cursor+=size.length;this._total+=size.length;this._state=State.STATE_CONTENT;return true;};EBMLDecoder.prototype.readContent=function(){var tagObj=this._tag_stack[this._tag_stack.length-1];if(tagObj.type==='m'){tagObj.isEnd=false;this._result.push(tagObj);this._state=State.STATE_TAG;if(tagObj.dataSize===0){var elm=Object.assign({},tagObj,{isEnd:true});this._result.push(elm);this._tag_stack.pop();}
return true;}
if(this._buffer.length<this._cursor+tagObj.dataSize){return false;}
var data=this._buffer.slice(this._cursor,this._cursor+tagObj.dataSize);this._buffer=this._buffer.slice(this._cursor+tagObj.dataSize);tagObj.data=data;switch(tagObj.type){case "u":tagObj.value=data.readUIntBE(0,data.length);break;case "i":tagObj.value=data.readIntBE(0,data.length);break;case "f":tagObj.value=tagObj.dataSize===4?data.readFloatBE(0):tagObj.dataSize===8?data.readDoubleBE(0):(console.warn("cannot read "+tagObj.dataSize+" octets float. failback to 0"),0);break;case "s":tagObj.value=data.toString("ascii");break;case "8":tagObj.value=data.toString("utf8");break;case "b":tagObj.value=data;break;case "d":tagObj.value=tools_1.convertEBMLDateToJSDate(new int64_buffer_1.Int64BE(data).toNumber());break;}
if(tagObj.value===null){throw new Error("unknown tag type:"+tagObj.type);}
this._result.push(tagObj);this._total+=tagObj.dataSize;this._state=State.STATE_TAG;this._cursor=0;this._tag_stack.pop();while(this._tag_stack.length>0){var topEle=this._tag_stack[this._tag_stack.length-1];if(topEle.dataEnd<0){this._tag_stack.pop();return true;}
if(this._total<topEle.dataEnd){break;}
if(topEle.type!=="m"){throw new Error("parent element is not master element");}
var elm=Object.assign({},topEle,{isEnd:true});this._result.push(elm);this._tag_stack.pop();}
return true;};return EBMLDecoder;}());exports.default=EBMLDecoder;},{"./tools":5,"int64-buffer":15,"matroska/lib/schema":17}],2:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});var tools=require("./tools");var tools_1=require("./tools");var schema=require("matroska/lib/schema");var byEbmlID=schema.byEbmlID;var EBMLEncoder=(function(){function EBMLEncoder(){this._schema=byEbmlID;this._buffers=[];this._stack=[];}
EBMLEncoder.prototype.encode=function(elms){var _this=this;return tools.concat(elms.reduce(function(lst,elm){return lst.concat(_this.encodeChunk(elm));},[])).buffer;};EBMLEncoder.prototype.encodeChunk=function(elm){if(elm.type==="m"){if(!elm.isEnd){this.startTag(elm);}
else{this.endTag(elm);}}
else{this.writeTag(elm);}
return this.flush();};EBMLEncoder.prototype.flush=function(){var ret=this._buffers;this._buffers=[];return ret;};EBMLEncoder.prototype.getSchemaInfo=function(tagName){var tagNums=Object.keys(this._schema).map(Number);for(var i=0;i<tagNums.length;i++){var tagNum=tagNums[i];if(this._schema[tagNum].name===tagName){return new tools_1.Buffer(tagNum.toString(16),'hex');}}
return null;};EBMLEncoder.prototype.writeTag=function(elm){var tagName=elm.name;var tagId=this.getSchemaInfo(tagName);var tagData=elm.data;if(tagId==null){throw new Error('No schema entry found for '+tagName);}
var data=tools.encodeTag(tagId,tagData);if(this._stack.length>0){var last=this._stack[this._stack.length-1];last.children.push({tagId:tagId,elm:elm,children:[],data:data});return;}
this._buffers=this._buffers.concat(data);return;};EBMLEncoder.prototype.startTag=function(elm){var tagName=elm.name;var tagId=this.getSchemaInfo(tagName);if(tagId==null){throw new Error('No schema entry found for '+tagName);}
if(elm.unknownSize){var data=tools.encodeTag(tagId,new tools_1.Buffer(0),elm.unknownSize);this._buffers=this._buffers.concat(data);return;}
var tag={tagId:tagId,elm:elm,children:[],data:null};if(this._stack.length>0){this._stack[this._stack.length-1].children.push(tag);}
this._stack.push(tag);};EBMLEncoder.prototype.endTag=function(elm){var tagName=elm.name;var tag=this._stack.pop();if(tag==null){throw new Error("EBML structure is broken");}
if(tag.elm.name!==elm.name){throw new Error("EBML structure is broken");}
var childTagDataBuffers=tag.children.reduce(function(lst,child){if(child.data===null){throw new Error("EBML structure is broken");}
return lst.concat(child.data);},[]);var childTagDataBuffer=tools.concat(childTagDataBuffers);if(tag.elm.type==="m"){tag.data=tools.encodeTag(tag.tagId,childTagDataBuffer,tag.elm.unknownSize);}
else{tag.data=tools.encodeTag(tag.tagId,childTagDataBuffer);}
if(this._stack.length<1){this._buffers=this._buffers.concat(tag.data);}};return EBMLEncoder;}());exports.default=EBMLEncoder;},{"./tools":5,"matroska/lib/schema":17}],3:[function(require,module,exports){"use strict";var __extends=(this&&this.__extends)||(function(){var extendStatics=Object.setPrototypeOf||({__proto__:[]}instanceof Array&&function(d,b){d.__proto__=b;})||function(d,b){for(var p in b)if(b.hasOwnProperty(p))d[p]=b[p];};return function(d,b){extendStatics(d,b);function __(){this.constructor=d;}
d.prototype=b===null?Object.create(b):(__.prototype=b.prototype,new __());};})();Object.defineProperty(exports,"__esModule",{value:true});var events_1=require("events");var tools=require("./tools");var EBMLReader=(function(_super){__extends(EBMLReader,_super);function EBMLReader(){var _this=_super.call(this)||this;_this.logGroup="";_this.hasLoggingStarted=false;_this.metadataloaded=false;_this.chunks=[];_this.stack=[];_this.segmentOffset=0;_this.last2SimpleBlockVideoTrackTimecode=[0,0];_this.last2SimpleBlockAudioTrackTimecode=[0,0];_this.lastClusterTimecode=0;_this.lastClusterPosition=0;_this.timecodeScale=1000000;_this.metadataSize=0;_this.metadatas=[];_this.cues=[];_this.firstVideoBlockRead=false;_this.firstAudioBlockRead=false;_this.currentTrack={TrackNumber:-1,TrackType:-1,DefaultDuration:null,CodecDelay:null};_this.trackTypes=[];_this.trackDefaultDuration=[];_this.trackCodecDelay=[];_this.trackInfo={type:"nothing"};_this.ended=false;_this.logging=false;_this.use_duration_every_simpleblock=false;_this.use_webp=false;_this.use_segment_info=true;_this.drop_default_duration=true;return _this;}
EBMLReader.prototype.stop=function(){this.ended=true;this.emit_segment_info();while(this.stack.length){this.stack.pop();if(this.logging){console.groupEnd();}}
if(this.logging&&this.hasLoggingStarted&&this.logGroup){console.groupEnd();}};EBMLReader.prototype.emit_segment_info=function(){var data=this.chunks;this.chunks=[];if(!this.metadataloaded){this.metadataloaded=true;this.metadatas=data;var videoTrackNum=this.trackTypes.indexOf(1);var audioTrackNum=this.trackTypes.indexOf(2);this.trackInfo=videoTrackNum>=0&&audioTrackNum>=0?{type:"both",trackNumber:videoTrackNum}:videoTrackNum>=0?{type:"video",trackNumber:videoTrackNum}:audioTrackNum>=0?{type:"audio",trackNumber:audioTrackNum}:{type:"nothing"};if(!this.use_segment_info){return;}
this.emit("metadata",{data:data,metadataSize:this.metadataSize});}
else{if(!this.use_segment_info){return;}
var timecode=this.lastClusterTimecode;var duration=this.duration;var timecodeScale=this.timecodeScale;this.emit("cluster",{timecode:timecode,data:data});this.emit("duration",{timecodeScale:timecodeScale,duration:duration});}};EBMLReader.prototype.read=function(elm){var _this=this;var drop=false;if(this.ended){return;}
if(elm.type==="m"){if(elm.isEnd){this.stack.pop();}
else{var parent_1=this.stack[this.stack.length-1];if(parent_1!=null&&parent_1.level>=elm.level){this.stack.pop();if(this.logging){console.groupEnd();}
parent_1.dataEnd=elm.dataEnd;parent_1.dataSize=elm.dataEnd-parent_1.dataStart;parent_1.unknownSize=false;var o=Object.assign({},parent_1,{name:parent_1.name,type:parent_1.type,isEnd:true});this.chunks.push(o);}
this.stack.push(elm);}}
if(elm.type==="m"&&elm.name=="Segment"){if(this.segmentOffset!=0){console.warn("Multiple segments detected!");}
this.segmentOffset=elm.dataStart;this.emit("segment_offset",this.segmentOffset);}
else if(elm.type==="b"&&elm.name==="SimpleBlock"){var _a=tools.ebmlBlock(elm.data),timecode=_a.timecode,trackNumber=_a.trackNumber,frames_1=_a.frames;if(this.trackTypes[trackNumber]===1){if(!this.firstVideoBlockRead){this.firstVideoBlockRead=true;if(this.trackInfo.type==="both"||this.trackInfo.type==="video"){var CueTime=this.lastClusterTimecode+timecode;this.cues.push({CueTrack:trackNumber,CueClusterPosition:this.lastClusterPosition,CueTime:CueTime});this.emit("cue_info",{CueTrack:trackNumber,CueClusterPosition:this.lastClusterPosition,CueTime:this.lastClusterTimecode});this.emit("cue",{CueTrack:trackNumber,CueClusterPosition:this.lastClusterPosition,CueTime:CueTime});}}
this.last2SimpleBlockVideoTrackTimecode=[this.last2SimpleBlockVideoTrackTimecode[1],timecode];}
else if(this.trackTypes[trackNumber]===2){if(!this.firstAudioBlockRead){this.firstAudioBlockRead=true;if(this.trackInfo.type==="audio"){var CueTime=this.lastClusterTimecode+timecode;this.cues.push({CueTrack:trackNumber,CueClusterPosition:this.lastClusterPosition,CueTime:CueTime});this.emit("cue_info",{CueTrack:trackNumber,CueClusterPosition:this.lastClusterPosition,CueTime:this.lastClusterTimecode});this.emit("cue",{CueTrack:trackNumber,CueClusterPosition:this.lastClusterPosition,CueTime:CueTime});}}
this.last2SimpleBlockAudioTrackTimecode=[this.last2SimpleBlockAudioTrackTimecode[1],timecode];}
if(this.use_duration_every_simpleblock){this.emit("duration",{timecodeScale:this.timecodeScale,duration:this.duration});}
if(this.use_webp){frames_1.forEach(function(frame){var startcode=frame.slice(3,6).toString("hex");if(startcode!=="9d012a"){return;};var webpBuf=tools.VP8BitStreamToRiffWebPBuffer(frame);var webp=new Blob([webpBuf],{type:"image/webp"});var currentTime=_this.duration;_this.emit("webp",{currentTime:currentTime,webp:webp});});}}
else if(elm.type==="m"&&elm.name==="Cluster"&&elm.isEnd===false){this.firstVideoBlockRead=false;this.firstAudioBlockRead=false;this.emit_segment_info();this.emit("cluster_ptr",elm.tagStart);this.lastClusterPosition=elm.tagStart;}
else if(elm.type==="u"&&elm.name==="Timecode"){this.lastClusterTimecode=elm.value;}
else if(elm.type==="u"&&elm.name==="TimecodeScale"){this.timecodeScale=elm.value;}
else if(elm.type==="m"&&elm.name==="TrackEntry"){if(elm.isEnd){this.trackTypes[this.currentTrack.TrackNumber]=this.currentTrack.TrackType;this.trackDefaultDuration[this.currentTrack.TrackNumber]=this.currentTrack.DefaultDuration;this.trackCodecDelay[this.currentTrack.TrackNumber]=this.currentTrack.CodecDelay;}
else{this.currentTrack={TrackNumber:-1,TrackType:-1,DefaultDuration:null,CodecDelay:null};}}
else if(elm.type==="u"&&elm.name==="TrackType"){this.currentTrack.TrackType=elm.value;}
else if(elm.type==="u"&&elm.name==="TrackNumber"){this.currentTrack.TrackNumber=elm.value;}
else if(elm.type==="u"&&elm.name==="CodecDelay"){this.currentTrack.CodecDelay=elm.value;}
else if(elm.type==="u"&&elm.name==="DefaultDuration"){if(this.drop_default_duration){console.warn("DefaultDuration detected!, remove it");drop=true;}
else{this.currentTrack.DefaultDuration=elm.value;}}
else if(elm.name==="unknown"){console.warn(elm);}
if(!this.metadataloaded&&elm.dataEnd>0){this.metadataSize=elm.dataEnd;}
if(!drop){this.chunks.push(elm);}
if(this.logging){this.put(elm);}};Object.defineProperty(EBMLReader.prototype,"duration",{get:function(){if(this.trackInfo.type==="nothing"){console.warn("no video, no audio track");return 0;}
var defaultDuration=0;var codecDelay=0;var lastTimecode=0;var _defaultDuration=this.trackDefaultDuration[this.trackInfo.trackNumber];if(typeof _defaultDuration==="number"){defaultDuration=_defaultDuration;}
else{if(this.trackInfo.type==="both"){if(this.last2SimpleBlockAudioTrackTimecode[1]>this.last2SimpleBlockVideoTrackTimecode[1]){defaultDuration=(this.last2SimpleBlockAudioTrackTimecode[1]-this.last2SimpleBlockAudioTrackTimecode[0])*this.timecodeScale;var delay=this.trackCodecDelay[this.trackTypes.indexOf(2)];if(typeof delay==="number"){codecDelay=delay;}
lastTimecode=this.last2SimpleBlockAudioTrackTimecode[1];}
else{defaultDuration=(this.last2SimpleBlockVideoTrackTimecode[1]-this.last2SimpleBlockVideoTrackTimecode[0])*this.timecodeScale;var delay=this.trackCodecDelay[this.trackTypes.indexOf(1)];if(typeof delay==="number"){codecDelay=delay;}
lastTimecode=this.last2SimpleBlockVideoTrackTimecode[1];}}
else if(this.trackInfo.type==="video"){defaultDuration=(this.last2SimpleBlockVideoTrackTimecode[1]-this.last2SimpleBlockVideoTrackTimecode[0])*this.timecodeScale;var delay=this.trackCodecDelay[this.trackInfo.trackNumber];if(typeof delay==="number"){codecDelay=delay;}
lastTimecode=this.last2SimpleBlockVideoTrackTimecode[1];}
else if(this.trackInfo.type==="audio"){defaultDuration=(this.last2SimpleBlockAudioTrackTimecode[1]-this.last2SimpleBlockAudioTrackTimecode[0])*this.timecodeScale;var delay=this.trackCodecDelay[this.trackInfo.trackNumber];if(typeof delay==="number"){codecDelay=delay;}
lastTimecode=this.last2SimpleBlockAudioTrackTimecode[1];}}
var duration_nanosec=((this.lastClusterTimecode+lastTimecode)*this.timecodeScale)+defaultDuration-codecDelay;var duration=duration_nanosec/this.timecodeScale;return Math.floor(duration);},enumerable:true,configurable:true});EBMLReader.prototype.addListener=function(event,listener){return _super.prototype.addListener.call(this,event,listener);};EBMLReader.prototype.put=function(elm){if(!this.hasLoggingStarted){this.hasLoggingStarted=true;if(this.logging&&this.logGroup){console.groupCollapsed(this.logGroup);}}
if(elm.type==="m"){if(elm.isEnd){console.groupEnd();}
else{console.group(elm.name+":"+elm.tagStart);}}
else if(elm.type==="b"){console.log(elm.name,elm.type);}
else{console.log(elm.name,elm.tagStart,elm.type,elm.value);}};return EBMLReader;}(events_1.EventEmitter));exports.default=EBMLReader;;;;;},{"./tools":5,"events":13}],4:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});var EBMLDecoder_1=require("./EBMLDecoder");exports.Decoder=EBMLDecoder_1.default;var EBMLEncoder_1=require("./EBMLEncoder");exports.Encoder=EBMLEncoder_1.default;var EBMLReader_1=require("./EBMLReader");exports.Reader=EBMLReader_1.default;var tools=require("./tools");exports.tools=tools;var version=require("../package.json").version;exports.version=version;},{"../package.json":18,"./EBMLDecoder":1,"./EBMLEncoder":2,"./EBMLReader":3,"./tools":5}],5:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});var int64_buffer_1=require("int64-buffer");var EBMLEncoder_1=require("./EBMLEncoder");var _Buffer=require("buffer/");var _tools=require("ebml/lib/ebml/tools");var _block=require("ebml-block");exports.Buffer=_Buffer.Buffer;exports.readVint=_tools.readVint;exports.writeVint=_tools.writeVint;exports.ebmlBlock=_block;function readBlock(buf){return exports.ebmlBlock(new exports.Buffer(buf));}
exports.readBlock=readBlock;function encodeTag(tagId,tagData,unknownSize){if(unknownSize===void 0){unknownSize=false;}
return concat([tagId,unknownSize?new exports.Buffer('01ffffffffffffff','hex'):exports.writeVint(tagData.length),tagData]);}
exports.encodeTag=encodeTag;function WebPFrameFilter(elms){return WebPBlockFilter(elms).reduce(function(lst,elm){var o=exports.ebmlBlock(elm.data);return o.frames.reduce(function(lst,frame){var webpBuf=VP8BitStreamToRiffWebPBuffer(frame);var webp=new Blob([webpBuf],{type:"image/webp"});return lst.concat(webp);},lst);},[]);}
exports.WebPFrameFilter=WebPFrameFilter;function WebPBlockFilter(elms){return elms.reduce(function(lst,elm){if(elm.type!=="b"){return lst;}
if(elm.name!=="SimpleBlock"){return lst;}
var o=exports.ebmlBlock(elm.data);var hasWebP=o.frames.some(function(frame){var startcode=frame.slice(3,6).toString("hex");return startcode==="9d012a";});if(!hasWebP){return lst;}
return lst.concat(elm);},[]);}
exports.WebPBlockFilter=WebPBlockFilter;function VP8BitStreamToRiffWebPBuffer(frame){var VP8Chunk=createRIFFChunk("VP8 ",frame);var WebPChunk=concat([new exports.Buffer("WEBP","ascii"),VP8Chunk]);return createRIFFChunk("RIFF",WebPChunk);}
exports.VP8BitStreamToRiffWebPBuffer=VP8BitStreamToRiffWebPBuffer;function createRIFFChunk(FourCC,chunk){var chunkSize=new exports.Buffer(4);chunkSize.writeUInt32LE(chunk.byteLength,0);return concat([new exports.Buffer(FourCC.substr(0,4),"ascii"),chunkSize,chunk,new exports.Buffer(chunk.byteLength%2===0?0:1)]);}
exports.createRIFFChunk=createRIFFChunk;function makeMetadataSeekable(originalMetadata,duration,cuesInfo){var header=extractElement("EBML",originalMetadata);var headerSize=encodedSizeOfEbml(header);var segmentContentStartPos=headerSize+12;var originalMetadataSize=originalMetadata[originalMetadata.length-1].dataEnd-segmentContentStartPos;var info=extractElement("Info",originalMetadata);removeElement("Duration",info);info.splice(1,0,{name:"Duration",type:"f",data:createFloatBuffer(duration,8)});var infoSize=encodedSizeOfEbml(info);var tracks=extractElement("Tracks",originalMetadata);var tracksSize=encodedSizeOfEbml(tracks);var seekHeadSize=47;var seekHead=[];var cuesSize=5+cuesInfo.length*15;var cues=[];var lastSizeDifference=-1;var maxIterations=10;var _loop_1=function(i){var infoStart=seekHeadSize;var tracksStart=infoStart+infoSize;var cuesStart=tracksStart+tracksSize;var newMetadataSize=cuesStart+cuesSize;var sizeDifference=newMetadataSize-originalMetadataSize;seekHead=[];seekHead.push({name:"SeekHead",type:"m",isEnd:false});seekHead.push({name:"Seek",type:"m",isEnd:false});seekHead.push({name:"SeekID",type:"b",data:new exports.Buffer([0x15,0x49,0xA9,0x66])});seekHead.push({name:"SeekPosition",type:"u",data:createUIntBuffer(infoStart)});seekHead.push({name:"Seek",type:"m",isEnd:true});seekHead.push({name:"Seek",type:"m",isEnd:false});seekHead.push({name:"SeekID",type:"b",data:new exports.Buffer([0x16,0x54,0xAE,0x6B])});seekHead.push({name:"SeekPosition",type:"u",data:createUIntBuffer(tracksStart)});seekHead.push({name:"Seek",type:"m",isEnd:true});seekHead.push({name:"Seek",type:"m",isEnd:false});seekHead.push({name:"SeekID",type:"b",data:new exports.Buffer([0x1C,0x53,0xBB,0x6B])});seekHead.push({name:"SeekPosition",type:"u",data:createUIntBuffer(cuesStart)});seekHead.push({name:"Seek",type:"m",isEnd:true});seekHead.push({name:"SeekHead",type:"m",isEnd:true});seekHeadSize=encodedSizeOfEbml(seekHead);cues=[];cues.push({name:"Cues",type:"m",isEnd:false});cuesInfo.forEach(function(_a){var CueTrack=_a.CueTrack,CueClusterPosition=_a.CueClusterPosition,CueTime=_a.CueTime;cues.push({name:"CuePoint",type:"m",isEnd:false});cues.push({name:"CueTime",type:"u",data:createUIntBuffer(CueTime)});cues.push({name:"CueTrackPositions",type:"m",isEnd:false});cues.push({name:"CueTrack",type:"u",data:createUIntBuffer(CueTrack)});CueClusterPosition-=segmentContentStartPos;CueClusterPosition+=sizeDifference;cues.push({name:"CueClusterPosition",type:"u",data:createUIntBuffer(CueClusterPosition)});cues.push({name:"CueTrackPositions",type:"m",isEnd:true});cues.push({name:"CuePoint",type:"m",isEnd:true});});cues.push({name:"Cues",type:"m",isEnd:true});cuesSize=encodedSizeOfEbml(cues);if(lastSizeDifference!==sizeDifference){lastSizeDifference=sizeDifference;if(i===maxIterations-1){throw new Error("Failed to converge to a stable metadata size");}}
else{return "break";}};for(var i=0;i<maxIterations;i++){var state_1=_loop_1(i);if(state_1==="break")
break;}
var finalMetadata=[].concat.apply([],[header,{name:"Segment",type:"m",isEnd:false,unknownSize:true},seekHead,info,tracks,cues]);var result=new EBMLEncoder_1.default().encode(finalMetadata);return result;}
exports.makeMetadataSeekable=makeMetadataSeekable;function removeElement(idName,metadata){var result=[];var start=-1;for(var i=0;i<metadata.length;i++){var element=metadata[i];if(element.name===idName){if(element.type==="m"){if(!element.isEnd){start=i;}
else{if(start==-1)
throw new Error("Detected "+idName+" closing element before finding the start");metadata.splice(start,i-start+1);return;}}
else{metadata.splice(i,1);return;}}}}
exports.removeElement=removeElement;function extractElement(idName,metadata){var result=[];var start=-1;for(var i=0;i<metadata.length;i++){var element=metadata[i];if(element.name===idName){if(element.type==="m"){if(!element.isEnd){start=i;}
else{if(start==-1)
throw new Error("Detected "+idName+" closing element before finding the start");result=metadata.slice(start,i+1);break;}}
else{result.push(metadata[i]);break;}}}
return result;}
exports.extractElement=extractElement;function putRefinedMetaData(metadata,info){if(Array.isArray(info.cueInfos)&&!Array.isArray(info.cues)){console.warn("putRefinedMetaData: info.cueInfos property is deprecated. please use info.cues");info.cues=info.cueInfos;}
var ebml=[];var payload=[];for(var i_1=0;i_1<metadata.length;i_1++){var elm=metadata[i_1];if(elm.type==="m"&&elm.name==="Segment"){ebml=metadata.slice(0,i_1);payload=metadata.slice(i_1);if(elm.unknownSize){payload.shift();break;}
throw new Error("this metadata is not streaming webm file");}}
if(!(payload[payload.length-1].dataEnd>0)){throw new Error("metadata dataEnd has wrong number");}
var originalPayloadOffsetEnd=payload[payload.length-1].dataEnd;var ebmlSize=ebml[ebml.length-1].dataEnd;var refinedEBMLSize=new EBMLEncoder_1.default().encode(ebml).byteLength;var offsetDiff=refinedEBMLSize-ebmlSize;var payloadSize=originalPayloadOffsetEnd-payload[0].tagStart;var segmentSize=payload[0].tagStart-ebmlSize;var segmentOffset=payload[0].tagStart;var segmentTagBuf=new exports.Buffer([0x18,0x53,0x80,0x67]);var segmentSizeBuf=new exports.Buffer('01ffffffffffffff','hex');var _segmentSize=segmentTagBuf.byteLength+segmentSizeBuf.byteLength;var newPayloadSize=payloadSize;var i;for(i=1;i<20;i++){var newPayloadOffsetEnd=ebmlSize+_segmentSize+newPayloadSize;var offsetEndDiff=newPayloadOffsetEnd-originalPayloadOffsetEnd;var sizeDiff=offsetDiff+offsetEndDiff;var refined=refineMetadata(payload,sizeDiff,info);var newNewRefinedSize=new EBMLEncoder_1.default().encode(refined).byteLength;if(newNewRefinedSize===newPayloadSize){return new EBMLEncoder_1.default().encode([].concat(ebml,[{type:"m",name:"Segment",isEnd:false,unknownSize:true}],refined));}
newPayloadSize=newNewRefinedSize;}
throw new Error("unable to refine metadata, stable size could not be found in "+i+" iterations!");}
exports.putRefinedMetaData=putRefinedMetaData;function encodedSizeOfEbml(refinedMetaData){var encorder=new EBMLEncoder_1.default();return refinedMetaData.reduce(function(lst,elm){return lst.concat(encorder.encode([elm]));},[]).reduce(function(o,buf){return o+buf.byteLength;},0);}
function refineMetadata(mesetadata,sizeDiff,info){var duration=info.duration,clusterPtrs=info.clusterPtrs,cues=info.cues;var _metadata=mesetadata.slice(0);if(typeof duration==="number"){var overwrited_1=false;_metadata.forEach(function(elm){if(elm.type==="f"&&elm.name==="Duration"){overwrited_1=true;elm.data=createFloatBuffer(duration,8);}});if(!overwrited_1){insertTag(_metadata,"Info",[{name:"Duration",type:"f",data:createFloatBuffer(duration,8)}]);}}
if(Array.isArray(cues)){insertTag(_metadata,"Cues",create_cue(cues,sizeDiff));}
var seekhead_children=[];if(Array.isArray(clusterPtrs)){console.warn("append cluster pointers to seekhead is deprecated. please use cues");seekhead_children=create_seek_from_clusters(clusterPtrs,sizeDiff);}
insertTag(_metadata,"SeekHead",seekhead_children,true);return _metadata;}
function create_seekhead(metadata,sizeDiff){var seeks=[];["Info","Tracks","Cues"].forEach(function(tagName){var tagStarts=metadata.filter(function(elm){return elm.type==="m"&&elm.name===tagName&&elm.isEnd===false;}).map(function(elm){return elm["tagStart"];});var tagStart=tagStarts[0];if(typeof tagStart!=="number"){return;}
seeks.push({name:"Seek",type:"m",isEnd:false});switch(tagName){case "Info":seeks.push({name:"SeekID",type:"b",data:new exports.Buffer([0x15,0x49,0xA9,0x66])});break;case "Tracks":seeks.push({name:"SeekID",type:"b",data:new exports.Buffer([0x16,0x54,0xAE,0x6B])});break;case "Cues":seeks.push({name:"SeekID",type:"b",data:new exports.Buffer([0x1C,0x53,0xBB,0x6B])});break;}
seeks.push({name:"SeekPosition",type:"u",data:createUIntBuffer(tagStart+sizeDiff)});seeks.push({name:"Seek",type:"m",isEnd:true});});return seeks;}
function create_seek_from_clusters(clusterPtrs,sizeDiff){var seeks=[];clusterPtrs.forEach(function(start){seeks.push({name:"Seek",type:"m",isEnd:false});seeks.push({name:"SeekID",type:"b",data:new exports.Buffer([0x1F,0x43,0xB6,0x75])});seeks.push({name:"SeekPosition",type:"u",data:createUIntBuffer(start+sizeDiff)});seeks.push({name:"Seek",type:"m",isEnd:true});});return seeks;}
function create_cue(cueInfos,sizeDiff){var cues=[];cueInfos.forEach(function(_a){var CueTrack=_a.CueTrack,CueClusterPosition=_a.CueClusterPosition,CueTime=_a.CueTime;cues.push({name:"CuePoint",type:"m",isEnd:false});cues.push({name:"CueTime",type:"u",data:createUIntBuffer(CueTime)});cues.push({name:"CueTrackPositions",type:"m",isEnd:false});cues.push({name:"CueTrack",type:"u",data:createUIntBuffer(CueTrack)});cues.push({name:"CueClusterPosition",type:"u",data:createUIntBuffer(CueClusterPosition+sizeDiff)});cues.push({name:"CueTrackPositions",type:"m",isEnd:true});cues.push({name:"CuePoint",type:"m",isEnd:true});});return cues;}
function insertTag(_metadata,tagName,children,insertHead){if(insertHead===void 0){insertHead=false;}
var idx=-1;for(var i=0;i<_metadata.length;i++){var elm=_metadata[i];if(elm.type==="m"&&elm.name===tagName&&elm.isEnd===false){idx=i;break;}}
if(idx>=0){Array.prototype.splice.apply(_metadata,[idx+1,0].concat(children));}
else if(insertHead){[].concat([{name:tagName,type:"m",isEnd:false}],children,[{name:tagName,type:"m",isEnd:true}]).reverse().forEach(function(elm){_metadata.unshift(elm);});}
else{_metadata.push({name:tagName,type:"m",isEnd:false});children.forEach(function(elm){_metadata.push(elm);});_metadata.push({name:tagName,type:"m",isEnd:true});}}
function concat(list){var i=0;var length=0;for(;i<list.length;++i){length+=list[i].length;}
var buffer=exports.Buffer.allocUnsafe(length);var pos=0;for(i=0;i<list.length;++i){var buf=list[i];buf.copy(buffer,pos);pos+=buf.length;}
return buffer;}
exports.concat=concat;function encodeValueToBuffer(elm){var data=new exports.Buffer(0);if(elm.type==="m"){return elm;}
switch(elm.type){case "u":data=createUIntBuffer(elm.value);break;case "i":data=createIntBuffer(elm.value);break;case "f":data=createFloatBuffer(elm.value);break;case "s":data=new exports.Buffer(elm.value,'ascii');break;case "8":data=new exports.Buffer(elm.value,'utf8');break;case "b":data=elm.value;break;case "d":data=new int64_buffer_1.Int64BE(elm.value.getTime().toString()).toBuffer();break;}
return Object.assign({},elm,{data:data});}
exports.encodeValueToBuffer=encodeValueToBuffer;function createUIntBuffer(value){var bytes=1;for(;value>=Math.pow(2,8*bytes);bytes++){}
if(bytes>=7){console.warn("7bit or more bigger uint not supported.");return new int64_buffer_1.Uint64BE(value).toBuffer();}
var data=new exports.Buffer(bytes);data.writeUIntBE(value,0,bytes);return data;}
exports.createUIntBuffer=createUIntBuffer;function createIntBuffer(value){var bytes=1;for(;value>=Math.pow(2,8*bytes);bytes++){}
if(bytes>=7){console.warn("7bit or more bigger uint not supported.");return new int64_buffer_1.Int64BE(value).toBuffer();}
var data=new exports.Buffer(bytes);data.writeIntBE(value,0,bytes);return data;}
exports.createIntBuffer=createIntBuffer;function createFloatBuffer(value,bytes){if(bytes===void 0){bytes=8;}
if(bytes===8){var data=new exports.Buffer(8);data.writeDoubleBE(value,0);return data;}
else if(bytes===4){var data=new exports.Buffer(4);data.writeFloatBE(value,0);return data;}
else{throw new Error("float type bits must 4bytes or 8bytes");}}
exports.createFloatBuffer=createFloatBuffer;function convertEBMLDateToJSDate(int64str){if(int64str instanceof Date){return int64str;}
return new Date(new Date("2001-01-01T00:00:00.000Z").getTime()+(Number(int64str)/1000/1000));}
exports.convertEBMLDateToJSDate=convertEBMLDateToJSDate;},{"./EBMLEncoder":2,"buffer/":8,"ebml-block":9,"ebml/lib/ebml/tools":12,"int64-buffer":15}],6:[function(require,module,exports){'use strict'
exports.byteLength=byteLength
exports.toByteArray=toByteArray
exports.fromByteArray=fromByteArray
var lookup=[]
var revLookup=[]
var Arr=typeof Uint8Array!=='undefined'?Uint8Array:Array
var code='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for(var i=0,len=code.length;i<len;++i){lookup[i]=code[i]
revLookup[code.charCodeAt(i)]=i}
revLookup['-'.charCodeAt(0)]=62
revLookup['_'.charCodeAt(0)]=63
function getLens(b64){var len=b64.length
if(len%4>0){throw new Error('Invalid string. Length must be a multiple of 4')}
var validLen=b64.indexOf('=')
if(validLen===-1)validLen=len
var placeHoldersLen=validLen===len?0:4-(validLen%4)
return[validLen,placeHoldersLen]}
function byteLength(b64){var lens=getLens(b64)
var validLen=lens[0]
var placeHoldersLen=lens[1]
return((validLen+placeHoldersLen)*3/4)-placeHoldersLen}
function _byteLength(b64,validLen,placeHoldersLen){return((validLen+placeHoldersLen)*3/4)-placeHoldersLen}
function toByteArray(b64){var tmp
var lens=getLens(b64)
var validLen=lens[0]
var placeHoldersLen=lens[1]
var arr=new Arr(_byteLength(b64,validLen,placeHoldersLen))
var curByte=0
var len=placeHoldersLen>0?validLen-4:validLen
for(var i=0;i<len;i+=4){tmp=(revLookup[b64.charCodeAt(i)]<<18)|(revLookup[b64.charCodeAt(i+1)]<<12)|(revLookup[b64.charCodeAt(i+2)]<<6)|revLookup[b64.charCodeAt(i+3)]
arr[curByte++]=(tmp>>16)&0xFF
arr[curByte++]=(tmp>>8)&0xFF
arr[curByte++]=tmp&0xFF}
if(placeHoldersLen===2){tmp=(revLookup[b64.charCodeAt(i)]<<2)|(revLookup[b64.charCodeAt(i+1)]>>4)
arr[curByte++]=tmp&0xFF}
if(placeHoldersLen===1){tmp=(revLookup[b64.charCodeAt(i)]<<10)|(revLookup[b64.charCodeAt(i+1)]<<4)|(revLookup[b64.charCodeAt(i+2)]>>2)
arr[curByte++]=(tmp>>8)&0xFF
arr[curByte++]=tmp&0xFF}
return arr}
function tripletToBase64(num){return lookup[num>>18&0x3F]+
lookup[num>>12&0x3F]+
lookup[num>>6&0x3F]+
lookup[num&0x3F]}
function encodeChunk(uint8,start,end){var tmp
var output=[]
for(var i=start;i<end;i+=3){tmp=((uint8[i]<<16)&0xFF0000)+
((uint8[i+1]<<8)&0xFF00)+
(uint8[i+2]&0xFF)
output.push(tripletToBase64(tmp))}
return output.join('')}
function fromByteArray(uint8){var tmp
var len=uint8.length
var extraBytes=len%3
var parts=[]
var maxChunkLength=16383
for(var i=0,len2=len-extraBytes;i<len2;i+=maxChunkLength){parts.push(encodeChunk(uint8,i,(i+maxChunkLength)>len2?len2:(i+maxChunkLength)))}
if(extraBytes===1){tmp=uint8[len-1]
parts.push(lookup[tmp>>2]+
lookup[(tmp<<4)&0x3F]+
'==')}else if(extraBytes===2){tmp=(uint8[len-2]<<8)+uint8[len-1]
parts.push(lookup[tmp>>10]+
lookup[(tmp>>4)&0x3F]+
lookup[(tmp<<2)&0x3F]+
'=')}
return parts.join('')}},{}],7:[function(require,module,exports){(function(global){/*!
* The buffer module from node.js, for the browser.
*
* @author Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
* @license MIT
*/'use strict'
var base64=require('base64-js')
var ieee754=require('ieee754')
var isArray=require('isarray')
exports.Buffer=Buffer
exports.SlowBuffer=SlowBuffer
exports.INSPECT_MAX_BYTES=50
Buffer.TYPED_ARRAY_SUPPORT=global.TYPED_ARRAY_SUPPORT!==undefined?global.TYPED_ARRAY_SUPPORT:typedArraySupport()
exports.kMaxLength=kMaxLength()
function typedArraySupport(){try{var arr=new Uint8Array(1)
arr.__proto__={__proto__:Uint8Array.prototype,foo:function(){return 42}}
return arr.foo()===42&&typeof arr.subarray==='function'&&arr.subarray(1,1).byteLength===0}catch(e){return false}}
function kMaxLength(){return Buffer.TYPED_ARRAY_SUPPORT?0x7fffffff:0x3fffffff}
function createBuffer(that,length){if(kMaxLength()<length){throw new RangeError('Invalid typed array length')}
if(Buffer.TYPED_ARRAY_SUPPORT){that=new Uint8Array(length)
that.__proto__=Buffer.prototype}else{if(that===null){that=new Buffer(length)}
that.length=length}
return that}
function Buffer(arg,encodingOrOffset,length){if(!Buffer.TYPED_ARRAY_SUPPORT&&!(this instanceof Buffer)){return new Buffer(arg,encodingOrOffset,length)}
if(typeof arg==='number'){if(typeof encodingOrOffset==='string'){throw new Error('If encoding is specified then the first argument must be a string')}
return allocUnsafe(this,arg)}
return from(this,arg,encodingOrOffset,length)}
Buffer.poolSize=8192
Buffer._augment=function(arr){arr.__proto__=Buffer.prototype
return arr}
function from(that,value,encodingOrOffset,length){if(typeof value==='number'){throw new TypeError('"value" argument must not be a number')}
if(typeof ArrayBuffer!=='undefined'&&value instanceof ArrayBuffer){return fromArrayBuffer(that,value,encodingOrOffset,length)}
if(typeof value==='string'){return fromString(that,value,encodingOrOffset)}
return fromObject(that,value)}
Buffer.from=function(value,encodingOrOffset,length){return from(null,value,encodingOrOffset,length)}
if(Buffer.TYPED_ARRAY_SUPPORT){Buffer.prototype.__proto__=Uint8Array.prototype
Buffer.__proto__=Uint8Array
if(typeof Symbol!=='undefined'&&Symbol.species&&Buffer[Symbol.species]===Buffer){Object.defineProperty(Buffer,Symbol.species,{value:null,configurable:true})}}
function assertSize(size){if(typeof size!=='number'){throw new TypeError('"size" argument must be a number')}else if(size<0){throw new RangeError('"size" argument must not be negative')}}
function alloc(that,size,fill,encoding){assertSize(size)
if(size<=0){return createBuffer(that,size)}
if(fill!==undefined){return typeof encoding==='string'?createBuffer(that,size).fill(fill,encoding):createBuffer(that,size).fill(fill)}
return createBuffer(that,size)}
Buffer.alloc=function(size,fill,encoding){return alloc(null,size,fill,encoding)}
function allocUnsafe(that,size){assertSize(size)
that=createBuffer(that,size<0?0:checked(size)|0)
if(!Buffer.TYPED_ARRAY_SUPPORT){for(var i=0;i<size;++i){that[i]=0}}
return that}
Buffer.allocUnsafe=function(size){return allocUnsafe(null,size)}
Buffer.allocUnsafeSlow=function(size){return allocUnsafe(null,size)}
function fromString(that,string,encoding){if(typeof encoding!=='string'||encoding===''){encoding='utf8'}
if(!Buffer.isEncoding(encoding)){throw new TypeError('"encoding" must be a valid string encoding')}
var length=byteLength(string,encoding)|0
that=createBuffer(that,length)
var actual=that.write(string,encoding)
if(actual!==length){that=that.slice(0,actual)}
return that}
function fromArrayLike(that,array){var length=array.length<0?0:checked(array.length)|0
that=createBuffer(that,length)
for(var i=0;i<length;i+=1){that[i]=array[i]&255}
return that}
function fromArrayBuffer(that,array,byteOffset,length){array.byteLength
if(byteOffset<0||array.byteLength<byteOffset){throw new RangeError('\'offset\' is out of bounds')}
if(array.byteLength<byteOffset+(length||0)){throw new RangeError('\'length\' is out of bounds')}
if(byteOffset===undefined&&length===undefined){array=new Uint8Array(array)}else if(length===undefined){array=new Uint8Array(array,byteOffset)}else{array=new Uint8Array(array,byteOffset,length)}
if(Buffer.TYPED_ARRAY_SUPPORT){that=array
that.__proto__=Buffer.prototype}else{that=fromArrayLike(that,array)}
return that}
function fromObject(that,obj){if(Buffer.isBuffer(obj)){var len=checked(obj.length)|0
that=createBuffer(that,len)
if(that.length===0){return that}
obj.copy(that,0,0,len)
return that}
if(obj){if((typeof ArrayBuffer!=='undefined'&&obj.buffer instanceof ArrayBuffer)||'length'in obj){if(typeof obj.length!=='number'||isnan(obj.length)){return createBuffer(that,0)}
return fromArrayLike(that,obj)}
if(obj.type==='Buffer'&&isArray(obj.data)){return fromArrayLike(that,obj.data)}}
throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')}
function checked(length){if(length>=kMaxLength()){throw new RangeError('Attempt to allocate Buffer larger than maximum '+
'size: 0x'+kMaxLength().toString(16)+' bytes')}
return length|0}
function SlowBuffer(length){if(+length!=length){length=0}
return Buffer.alloc(+length)}
Buffer.isBuffer=function isBuffer(b){return!!(b!=null&&b._isBuffer)}
Buffer.compare=function compare(a,b){if(!Buffer.isBuffer(a)||!Buffer.isBuffer(b)){throw new TypeError('Arguments must be Buffers')}
if(a===b)return 0
var x=a.length
var y=b.length
for(var i=0,len=Math.min(x,y);i<len;++i){if(a[i]!==b[i]){x=a[i]
y=b[i]
break}}
if(x<y)return-1
if(y<x)return 1
return 0}
Buffer.isEncoding=function isEncoding(encoding){switch(String(encoding).toLowerCase()){case 'hex':case 'utf8':case 'utf-8':case 'ascii':case 'latin1':case 'binary':case 'base64':case 'ucs2':case 'ucs-2':case 'utf16le':case 'utf-16le':return true
default:return false}}
Buffer.concat=function concat(list,length){if(!isArray(list)){throw new TypeError('"list" argument must be an Array of Buffers')}
if(list.length===0){return Buffer.alloc(0)}
var i
if(length===undefined){length=0
for(i=0;i<list.length;++i){length+=list[i].length}}
var buffer=Buffer.allocUnsafe(length)
var pos=0
for(i=0;i<list.length;++i){var buf=list[i]
if(!Buffer.isBuffer(buf)){throw new TypeError('"list" argument must be an Array of Buffers')}
buf.copy(buffer,pos)
pos+=buf.length}
return buffer}
function byteLength(string,encoding){if(Buffer.isBuffer(string)){return string.length}
if(typeof ArrayBuffer!=='undefined'&&typeof ArrayBuffer.isView==='function'&&(ArrayBuffer.isView(string)||string instanceof ArrayBuffer)){return string.byteLength}
if(typeof string!=='string'){string=''+string}
var len=string.length
if(len===0)return 0
var loweredCase=false
for(;;){switch(encoding){case 'ascii':case 'latin1':case 'binary':return len
case 'utf8':case 'utf-8':case undefined:return utf8ToBytes(string).length
case 'ucs2':case 'ucs-2':case 'utf16le':case 'utf-16le':return len*2
case 'hex':return len>>>1
case 'base64':return base64ToBytes(string).length
default:if(loweredCase)return utf8ToBytes(string).length
encoding=(''+encoding).toLowerCase()
loweredCase=true}}}
Buffer.byteLength=byteLength
function slowToString(encoding,start,end){var loweredCase=false
if(start===undefined||start<0){start=0}
if(start>this.length){return ''}
if(end===undefined||end>this.length){end=this.length}
if(end<=0){return ''}
end>>>=0
start>>>=0
if(end<=start){return ''}
if(!encoding)encoding='utf8'
while(true){switch(encoding){case 'hex':return hexSlice(this,start,end)
case 'utf8':case 'utf-8':return utf8Slice(this,start,end)
case 'ascii':return asciiSlice(this,start,end)
case 'latin1':case 'binary':return latin1Slice(this,start,end)
case 'base64':return base64Slice(this,start,end)
case 'ucs2':case 'ucs-2':case 'utf16le':case 'utf-16le':return utf16leSlice(this,start,end)
default:if(loweredCase)throw new TypeError('Unknown encoding: '+encoding)
encoding=(encoding+'').toLowerCase()
loweredCase=true}}}
Buffer.prototype._isBuffer=true
function swap(b,n,m){var i=b[n]
b[n]=b[m]
b[m]=i}
Buffer.prototype.swap16=function swap16(){var len=this.length
if(len%2!==0){throw new RangeError('Buffer size must be a multiple of 16-bits')}
for(var i=0;i<len;i+=2){swap(this,i,i+1)}
return this}
Buffer.prototype.swap32=function swap32(){var len=this.length
if(len%4!==0){throw new RangeError('Buffer size must be a multiple of 32-bits')}
for(var i=0;i<len;i+=4){swap(this,i,i+3)
swap(this,i+1,i+2)}
return this}
Buffer.prototype.swap64=function swap64(){var len=this.length
if(len%8!==0){throw new RangeError('Buffer size must be a multiple of 64-bits')}
for(var i=0;i<len;i+=8){swap(this,i,i+7)
swap(this,i+1,i+6)
swap(this,i+2,i+5)
swap(this,i+3,i+4)}
return this}
Buffer.prototype.toString=function toString(){var length=this.length|0
if(length===0)return ''
if(arguments.length===0)return utf8Slice(this,0,length)
return slowToString.apply(this,arguments)}
Buffer.prototype.equals=function equals(b){if(!Buffer.isBuffer(b))throw new TypeError('Argument must be a Buffer')
if(this===b)return true
return Buffer.compare(this,b)===0}
Buffer.prototype.inspect=function inspect(){var str=''
var max=exports.INSPECT_MAX_BYTES
if(this.length>0){str=this.toString('hex',0,max).match(/.{2}/g).join(' ')
if(this.length>max)str+=' ... '}
return '<Buffer '+str+'>'}
Buffer.prototype.compare=function compare(target,start,end,thisStart,thisEnd){if(!Buffer.isBuffer(target)){throw new TypeError('Argument must be a Buffer')}
if(start===undefined){start=0}
if(end===undefined){end=target?target.length:0}
if(thisStart===undefined){thisStart=0}
if(thisEnd===undefined){thisEnd=this.length}
if(start<0||end>target.length||thisStart<0||thisEnd>this.length){throw new RangeError('out of range index')}
if(thisStart>=thisEnd&&start>=end){return 0}
if(thisStart>=thisEnd){return-1}
if(start>=end){return 1}
start>>>=0
end>>>=0
thisStart>>>=0
thisEnd>>>=0
if(this===target)return 0
var x=thisEnd-thisStart
var y=end-start
var len=Math.min(x,y)
var thisCopy=this.slice(thisStart,thisEnd)
var targetCopy=target.slice(start,end)
for(var i=0;i<len;++i){if(thisCopy[i]!==targetCopy[i]){x=thisCopy[i]
y=targetCopy[i]
break}}
if(x<y)return-1
if(y<x)return 1
return 0}
function bidirectionalIndexOf(buffer,val,byteOffset,encoding,dir){if(buffer.length===0)return-1
if(typeof byteOffset==='string'){encoding=byteOffset
byteOffset=0}else if(byteOffset>0x7fffffff){byteOffset=0x7fffffff}else if(byteOffset<-0x80000000){byteOffset=-0x80000000}
byteOffset=+byteOffset
if(isNaN(byteOffset)){byteOffset=dir?0:(buffer.length-1)}
if(byteOffset<0)byteOffset=buffer.length+byteOffset
if(byteOffset>=buffer.length){if(dir)return-1
else byteOffset=buffer.length-1}else if(byteOffset<0){if(dir)byteOffset=0
else return-1}
if(typeof val==='string'){val=Buffer.from(val,encoding)}
if(Buffer.isBuffer(val)){if(val.length===0){return-1}
return arrayIndexOf(buffer,val,byteOffset,encoding,dir)}else if(typeof val==='number'){val=val&0xFF
if(Buffer.TYPED_ARRAY_SUPPORT&&typeof Uint8Array.prototype.indexOf==='function'){if(dir){return Uint8Array.prototype.indexOf.call(buffer,val,byteOffset)}else{return Uint8Array.prototype.lastIndexOf.call(buffer,val,byteOffset)}}
return arrayIndexOf(buffer,[val],byteOffset,encoding,dir)}
throw new TypeError('val must be string, number or Buffer')}
function arrayIndexOf(arr,val,byteOffset,encoding,dir){var indexSize=1
var arrLength=arr.length
var valLength=val.length
if(encoding!==undefined){encoding=String(encoding).toLowerCase()
if(encoding==='ucs2'||encoding==='ucs-2'||encoding==='utf16le'||encoding==='utf-16le'){if(arr.length<2||val.length<2){return-1}
indexSize=2
arrLength/=2
valLength/=2
byteOffset/=2}}
function read(buf,i){if(indexSize===1){return buf[i]}else{return buf.readUInt16BE(i*indexSize)}}
var i
if(dir){var foundIndex=-1
for(i=byteOffset;i<arrLength;i++){if(read(arr,i)===read(val,foundIndex===-1?0:i-foundIndex)){if(foundIndex===-1)foundIndex=i
if(i-foundIndex+1===valLength)return foundIndex*indexSize}else{if(foundIndex!==-1)i-=i-foundIndex
foundIndex=-1}}}else{if(byteOffset+valLength>arrLength)byteOffset=arrLength-valLength
for(i=byteOffset;i>=0;i--){var found=true
for(var j=0;j<valLength;j++){if(read(arr,i+j)!==read(val,j)){found=false
break}}
if(found)return i}}
return-1}
Buffer.prototype.includes=function includes(val,byteOffset,encoding){return this.indexOf(val,byteOffset,encoding)!==-1}
Buffer.prototype.indexOf=function indexOf(val,byteOffset,encoding){return bidirectionalIndexOf(this,val,byteOffset,encoding,true)}
Buffer.prototype.lastIndexOf=function lastIndexOf(val,byteOffset,encoding){return bidirectionalIndexOf(this,val,byteOffset,encoding,false)}
function hexWrite(buf,string,offset,length){offset=Number(offset)||0
var remaining=buf.length-offset
if(!length){length=remaining}else{length=Number(length)
if(length>remaining){length=remaining}}
var strLen=string.length
if(strLen%2!==0)throw new TypeError('Invalid hex string')
if(length>strLen/2){length=strLen/2}
for(var i=0;i<length;++i){var parsed=parseInt(string.substr(i*2,2),16)
if(isNaN(parsed))return i
buf[offset+i]=parsed}
return i}
function utf8Write(buf,string,offset,length){return blitBuffer(utf8ToBytes(string,buf.length-offset),buf,offset,length)}
function asciiWrite(buf,string,offset,length){return blitBuffer(asciiToBytes(string),buf,offset,length)}
function latin1Write(buf,string,offset,length){return asciiWrite(buf,string,offset,length)}
function base64Write(buf,string,offset,length){return blitBuffer(base64ToBytes(string),buf,offset,length)}
function ucs2Write(buf,string,offset,length){return blitBuffer(utf16leToBytes(string,buf.length-offset),buf,offset,length)}
Buffer.prototype.write=function write(string,offset,length,encoding){if(offset===undefined){encoding='utf8'
length=this.length
offset=0}else if(length===undefined&&typeof offset==='string'){encoding=offset
length=this.length
offset=0}else if(isFinite(offset)){offset=offset|0
if(isFinite(length)){length=length|0
if(encoding===undefined)encoding='utf8'}else{encoding=length
length=undefined}}else{throw new Error('Buffer.write(string, encoding, offset[, length]) is no longer supported')}
var remaining=this.length-offset
if(length===undefined||length>remaining)length=remaining
if((string.length>0&&(length<0||offset<0))||offset>this.length){throw new RangeError('Attempt to write outside buffer bounds')}
if(!encoding)encoding='utf8'
var loweredCase=false
for(;;){switch(encoding){case 'hex':return hexWrite(this,string,offset,length)
case 'utf8':case 'utf-8':return utf8Write(this,string,offset,length)
case 'ascii':return asciiWrite(this,string,offset,length)
case 'latin1':case 'binary':return latin1Write(this,string,offset,length)
case 'base64':return base64Write(this,string,offset,length)
case 'ucs2':case 'ucs-2':case 'utf16le':case 'utf-16le':return ucs2Write(this,string,offset,length)
default:if(loweredCase)throw new TypeError('Unknown encoding: '+encoding)
encoding=(''+encoding).toLowerCase()
loweredCase=true}}}
Buffer.prototype.toJSON=function toJSON(){return{type:'Buffer',data:Array.prototype.slice.call(this._arr||this,0)}}
function base64Slice(buf,start,end){if(start===0&&end===buf.length){return base64.fromByteArray(buf)}else{return base64.fromByteArray(buf.slice(start,end))}}
function utf8Slice(buf,start,end){end=Math.min(buf.length,end)
var res=[]
var i=start
while(i<end){var firstByte=buf[i]
var codePoint=null
var bytesPerSequence=(firstByte>0xEF)?4:(firstByte>0xDF)?3:(firstByte>0xBF)?2:1
if(i+bytesPerSequence<=end){var secondByte,thirdByte,fourthByte,tempCodePoint
switch(bytesPerSequence){case 1:if(firstByte<0x80){codePoint=firstByte}
break
case 2:secondByte=buf[i+1]
if((secondByte&0xC0)===0x80){tempCodePoint=(firstByte&0x1F)<<0x6|(secondByte&0x3F)
if(tempCodePoint>0x7F){codePoint=tempCodePoint}}
break
case 3:secondByte=buf[i+1]
thirdByte=buf[i+2]
if((secondByte&0xC0)===0x80&&(thirdByte&0xC0)===0x80){tempCodePoint=(firstByte&0xF)<<0xC|(secondByte&0x3F)<<0x6|(thirdByte&0x3F)
if(tempCodePoint>0x7FF&&(tempCodePoint<0xD800||tempCodePoint>0xDFFF)){codePoint=tempCodePoint}}
break
case 4:secondByte=buf[i+1]
thirdByte=buf[i+2]
fourthByte=buf[i+3]
if((secondByte&0xC0)===0x80&&(thirdByte&0xC0)===0x80&&(fourthByte&0xC0)===0x80){tempCodePoint=(firstByte&0xF)<<0x12|(secondByte&0x3F)<<0xC|(thirdByte&0x3F)<<0x6|(fourthByte&0x3F)
if(tempCodePoint>0xFFFF&&tempCodePoint<0x110000){codePoint=tempCodePoint}}}}
if(codePoint===null){codePoint=0xFFFD
bytesPerSequence=1}else if(codePoint>0xFFFF){codePoint-=0x10000
res.push(codePoint>>>10&0x3FF|0xD800)
codePoint=0xDC00|codePoint&0x3FF}
res.push(codePoint)
i+=bytesPerSequence}
return decodeCodePointsArray(res)}
var MAX_ARGUMENTS_LENGTH=0x1000
function decodeCodePointsArray(codePoints){var len=codePoints.length
if(len<=MAX_ARGUMENTS_LENGTH){return String.fromCharCode.apply(String,codePoints)}
var res=''
var i=0
while(i<len){res+=String.fromCharCode.apply(String,codePoints.slice(i,i+=MAX_ARGUMENTS_LENGTH))}
return res}
function asciiSlice(buf,start,end){var ret=''
end=Math.min(buf.length,end)
for(var i=start;i<end;++i){ret+=String.fromCharCode(buf[i]&0x7F)}
return ret}
function latin1Slice(buf,start,end){var ret=''
end=Math.min(buf.length,end)
for(var i=start;i<end;++i){ret+=String.fromCharCode(buf[i])}
return ret}
function hexSlice(buf,start,end){var len=buf.length
if(!start||start<0)start=0
if(!end||end<0||end>len)end=len
var out=''
for(var i=start;i<end;++i){out+=toHex(buf[i])}
return out}
function utf16leSlice(buf,start,end){var bytes=buf.slice(start,end)
var res=''
for(var i=0;i<bytes.length;i+=2){res+=String.fromCharCode(bytes[i]+bytes[i+1]*256)}
return res}
Buffer.prototype.slice=function slice(start,end){var len=this.length
start=~~start
end=end===undefined?len:~~end
if(start<0){start+=len
if(start<0)start=0}else if(start>len){start=len}
if(end<0){end+=len
if(end<0)end=0}else if(end>len){end=len}
if(end<start)end=start
var newBuf
if(Buffer.TYPED_ARRAY_SUPPORT){newBuf=this.subarray(start,end)
newBuf.__proto__=Buffer.prototype}else{var sliceLen=end-start
newBuf=new Buffer(sliceLen,undefined)
for(var i=0;i<sliceLen;++i){newBuf[i]=this[i+start]}}
return newBuf}
function checkOffset(offset,ext,length){if((offset%1)!==0||offset<0)throw new RangeError('offset is not uint')
if(offset+ext>length)throw new RangeError('Trying to access beyond buffer length')}
Buffer.prototype.readUIntLE=function readUIntLE(offset,byteLength,noAssert){offset=offset|0
byteLength=byteLength|0
if(!noAssert)checkOffset(offset,byteLength,this.length)
var val=this[offset]
var mul=1
var i=0
while(++i<byteLength&&(mul*=0x100)){val+=this[offset+i]*mul}
return val}
Buffer.prototype.readUIntBE=function readUIntBE(offset,byteLength,noAssert){offset=offset|0
byteLength=byteLength|0
if(!noAssert){checkOffset(offset,byteLength,this.length)}
var val=this[offset+--byteLength]
var mul=1
while(byteLength>0&&(mul*=0x100)){val+=this[offset+--byteLength]*mul}
return val}
Buffer.prototype.readUInt8=function readUInt8(offset,noAssert){if(!noAssert)checkOffset(offset,1,this.length)
return this[offset]}
Buffer.prototype.readUInt16LE=function readUInt16LE(offset,noAssert){if(!noAssert)checkOffset(offset,2,this.length)
return this[offset]|(this[offset+1]<<8)}
Buffer.prototype.readUInt16BE=function readUInt16BE(offset,noAssert){if(!noAssert)checkOffset(offset,2,this.length)
return(this[offset]<<8)|this[offset+1]}
Buffer.prototype.readUInt32LE=function readUInt32LE(offset,noAssert){if(!noAssert)checkOffset(offset,4,this.length)
return((this[offset])|(this[offset+1]<<8)|(this[offset+2]<<16))+
(this[offset+3]*0x1000000)}
Buffer.prototype.readUInt32BE=function readUInt32BE(offset,noAssert){if(!noAssert)checkOffset(offset,4,this.length)
return(this[offset]*0x1000000)+
((this[offset+1]<<16)|(this[offset+2]<<8)|this[offset+3])}
Buffer.prototype.readIntLE=function readIntLE(offset,byteLength,noAssert){offset=offset|0
byteLength=byteLength|0
if(!noAssert)checkOffset(offset,byteLength,this.length)
var val=this[offset]
var mul=1
var i=0
while(++i<byteLength&&(mul*=0x100)){val+=this[offset+i]*mul}
mul*=0x80
if(val>=mul)val-=Math.pow(2,8*byteLength)
return val}
Buffer.prototype.readIntBE=function readIntBE(offset,byteLength,noAssert){offset=offset|0
byteLength=byteLength|0
if(!noAssert)checkOffset(offset,byteLength,this.length)
var i=byteLength
var mul=1
var val=this[offset+--i]
while(i>0&&(mul*=0x100)){val+=this[offset+--i]*mul}
mul*=0x80
if(val>=mul)val-=Math.pow(2,8*byteLength)
return val}
Buffer.prototype.readInt8=function readInt8(offset,noAssert){if(!noAssert)checkOffset(offset,1,this.length)
if(!(this[offset]&0x80))return(this[offset])
return((0xff-this[offset]+1)*-1)}
Buffer.prototype.readInt16LE=function readInt16LE(offset,noAssert){if(!noAssert)checkOffset(offset,2,this.length)
var val=this[offset]|(this[offset+1]<<8)
return(val&0x8000)?val|0xFFFF0000:val}
Buffer.prototype.readInt16BE=function readInt16BE(offset,noAssert){if(!noAssert)checkOffset(offset,2,this.length)
var val=this[offset+1]|(this[offset]<<8)
return(val&0x8000)?val|0xFFFF0000:val}
Buffer.prototype.readInt32LE=function readInt32LE(offset,noAssert){if(!noAssert)checkOffset(offset,4,this.length)
return(this[offset])|(this[offset+1]<<8)|(this[offset+2]<<16)|(this[offset+3]<<24)}
Buffer.prototype.readInt32BE=function readInt32BE(offset,noAssert){if(!noAssert)checkOffset(offset,4,this.length)
return(this[offset]<<24)|(this[offset+1]<<16)|(this[offset+2]<<8)|(this[offset+3])}
Buffer.prototype.readFloatLE=function readFloatLE(offset,noAssert){if(!noAssert)checkOffset(offset,4,this.length)
return ieee754.read(this,offset,true,23,4)}
Buffer.prototype.readFloatBE=function readFloatBE(offset,noAssert){if(!noAssert)checkOffset(offset,4,this.length)
return ieee754.read(this,offset,false,23,4)}
Buffer.prototype.readDoubleLE=function readDoubleLE(offset,noAssert){if(!noAssert)checkOffset(offset,8,this.length)
return ieee754.read(this,offset,true,52,8)}
Buffer.prototype.readDoubleBE=function readDoubleBE(offset,noAssert){if(!noAssert)checkOffset(offset,8,this.length)
return ieee754.read(this,offset,false,52,8)}
function checkInt(buf,value,offset,ext,max,min){if(!Buffer.isBuffer(buf))throw new TypeError('"buffer" argument must be a Buffer instance')
if(value>max||value<min)throw new RangeError('"value" argument is out of bounds')
if(offset+ext>buf.length)throw new RangeError('Index out of range')}
Buffer.prototype.writeUIntLE=function writeUIntLE(value,offset,byteLength,noAssert){value=+value
offset=offset|0
byteLength=byteLength|0
if(!noAssert){var maxBytes=Math.pow(2,8*byteLength)-1
checkInt(this,value,offset,byteLength,maxBytes,0)}
var mul=1
var i=0
this[offset]=value&0xFF
while(++i<byteLength&&(mul*=0x100)){this[offset+i]=(value/mul)&0xFF}
return offset+byteLength}
Buffer.prototype.writeUIntBE=function writeUIntBE(value,offset,byteLength,noAssert){value=+value
offset=offset|0
byteLength=byteLength|0
if(!noAssert){var maxBytes=Math.pow(2,8*byteLength)-1
checkInt(this,value,offset,byteLength,maxBytes,0)}
var i=byteLength-1
var mul=1
this[offset+i]=value&0xFF
while(--i>=0&&(mul*=0x100)){this[offset+i]=(value/mul)&0xFF}
return offset+byteLength}
Buffer.prototype.writeUInt8=function writeUInt8(value,offset,noAssert){value=+value
offset=offset|0
if(!noAssert)checkInt(this,value,offset,1,0xff,0)
if(!Buffer.TYPED_ARRAY_SUPPORT)value=Math.floor(value)
this[offset]=(value&0xff)
return offset+1}
function objectWriteUInt16(buf,value,offset,littleEndian){if(value<0)value=0xffff+value+1
for(var i=0,j=Math.min(buf.length-offset,2);i<j;++i){buf[offset+i]=(value&(0xff<<(8*(littleEndian?i:1-i))))>>>(littleEndian?i:1-i)*8}}
Buffer.prototype.writeUInt16LE=function writeUInt16LE(value,offset,noAssert){value=+value
offset=offset|0
if(!noAssert)checkInt(this,value,offset,2,0xffff,0)
if(Buffer.TYPED_ARRAY_SUPPORT){this[offset]=(value&0xff)
this[offset+1]=(value>>>8)}else{objectWriteUInt16(this,value,offset,true)}
return offset+2}
Buffer.prototype.writeUInt16BE=function writeUInt16BE(value,offset,noAssert){value=+value
offset=offset|0
if(!noAssert)checkInt(this,value,offset,2,0xffff,0)
if(Buffer.TYPED_ARRAY_SUPPORT){this[offset]=(value>>>8)
this[offset+1]=(value&0xff)}else{objectWriteUInt16(this,value,offset,false)}
return offset+2}
function objectWriteUInt32(buf,value,offset,littleEndian){if(value<0)value=0xffffffff+value+1
for(var i=0,j=Math.min(buf.length-offset,4);i<j;++i){buf[offset+i]=(value>>>(littleEndian?i:3-i)*8)&0xff}}
Buffer.prototype.writeUInt32LE=function writeUInt32LE(value,offset,noAssert){value=+value
offset=offset|0
if(!noAssert)checkInt(this,value,offset,4,0xffffffff,0)
if(Buffer.TYPED_ARRAY_SUPPORT){this[offset+3]=(value>>>24)
this[offset+2]=(value>>>16)
this[offset+1]=(value>>>8)
this[offset]=(value&0xff)}else{objectWriteUInt32(this,value,offset,true)}
return offset+4}
Buffer.prototype.writeUInt32BE=function writeUInt32BE(value,offset,noAssert){value=+value
offset=offset|0
if(!noAssert)checkInt(this,value,offset,4,0xffffffff,0)
if(Buffer.TYPED_ARRAY_SUPPORT){this[offset]=(value>>>24)
this[offset+1]=(value>>>16)
this[offset+2]=(value>>>8)
this[offset+3]=(value&0xff)}else{objectWriteUInt32(this,value,offset,false)}
return offset+4}
Buffer.prototype.writeIntLE=function writeIntLE(value,offset,byteLength,noAssert){value=+value
offset=offset|0
if(!noAssert){var limit=Math.pow(2,8*byteLength-1)
checkInt(this,value,offset,byteLength,limit-1,-limit)}
var i=0
var mul=1
var sub=0
this[offset]=value&0xFF
while(++i<byteLength&&(mul*=0x100)){if(value<0&&sub===0&&this[offset+i-1]!==0){sub=1}
this[offset+i]=((value/mul)>>0)-sub&0xFF}
return offset+byteLength}
Buffer.prototype.writeIntBE=function writeIntBE(value,offset,byteLength,noAssert){value=+value
offset=offset|0
if(!noAssert){var limit=Math.pow(2,8*byteLength-1)
checkInt(this,value,offset,byteLength,limit-1,-limit)}
var i=byteLength-1
var mul=1
var sub=0
this[offset+i]=value&0xFF
while(--i>=0&&(mul*=0x100)){if(value<0&&sub===0&&this[offset+i+1]!==0){sub=1}
this[offset+i]=((value/mul)>>0)-sub&0xFF}
return offset+byteLength}
Buffer.prototype.writeInt8=function writeInt8(value,offset,noAssert){value=+value
offset=offset|0
if(!noAssert)checkInt(this,value,offset,1,0x7f,-0x80)
if(!Buffer.TYPED_ARRAY_SUPPORT)value=Math.floor(value)
if(value<0)value=0xff+value+1
this[offset]=(value&0xff)
return offset+1}
Buffer.prototype.writeInt16LE=function writeInt16LE(value,offset,noAssert){value=+value
offset=offset|0
if(!noAssert)checkInt(this,value,offset,2,0x7fff,-0x8000)
if(Buffer.TYPED_ARRAY_SUPPORT){this[offset]=(value&0xff)
this[offset+1]=(value>>>8)}else{objectWriteUInt16(this,value,offset,true)}
return offset+2}
Buffer.prototype.writeInt16BE=function writeInt16BE(value,offset,noAssert){value=+value
offset=offset|0
if(!noAssert)checkInt(this,value,offset,2,0x7fff,-0x8000)
if(Buffer.TYPED_ARRAY_SUPPORT){this[offset]=(value>>>8)
this[offset+1]=(value&0xff)}else{objectWriteUInt16(this,value,offset,false)}
return offset+2}
Buffer.prototype.writeInt32LE=function writeInt32LE(value,offset,noAssert){value=+value
offset=offset|0
if(!noAssert)checkInt(this,value,offset,4,0x7fffffff,-0x80000000)
if(Buffer.TYPED_ARRAY_SUPPORT){this[offset]=(value&0xff)
this[offset+1]=(value>>>8)
this[offset+2]=(value>>>16)
this[offset+3]=(value>>>24)}else{objectWriteUInt32(this,value,offset,true)}
return offset+4}
Buffer.prototype.writeInt32BE=function writeInt32BE(value,offset,noAssert){value=+value
offset=offset|0
if(!noAssert)checkInt(this,value,offset,4,0x7fffffff,-0x80000000)
if(value<0)value=0xffffffff+value+1
if(Buffer.TYPED_ARRAY_SUPPORT){this[offset]=(value>>>24)
this[offset+1]=(value>>>16)
this[offset+2]=(value>>>8)
this[offset+3]=(value&0xff)}else{objectWriteUInt32(this,value,offset,false)}
return offset+4}
function checkIEEE754(buf,value,offset,ext,max,min){if(offset+ext>buf.length)throw new RangeError('Index out of range')
if(offset<0)throw new RangeError('Index out of range')}
function writeFloat(buf,value,offset,littleEndian,noAssert){if(!noAssert){checkIEEE754(buf,value,offset,4,3.4028234663852886e+38,-3.4028234663852886e+38)}
ieee754.write(buf,value,offset,littleEndian,23,4)
return offset+4}
Buffer.prototype.writeFloatLE=function writeFloatLE(value,offset,noAssert){return writeFloat(this,value,offset,true,noAssert)}
Buffer.prototype.writeFloatBE=function writeFloatBE(value,offset,noAssert){return writeFloat(this,value,offset,false,noAssert)}
function writeDouble(buf,value,offset,littleEndian,noAssert){if(!noAssert){checkIEEE754(buf,value,offset,8,1.7976931348623157E+308,-1.7976931348623157E+308)}
ieee754.write(buf,value,offset,littleEndian,52,8)
return offset+8}
Buffer.prototype.writeDoubleLE=function writeDoubleLE(value,offset,noAssert){return writeDouble(this,value,offset,true,noAssert)}
Buffer.prototype.writeDoubleBE=function writeDoubleBE(value,offset,noAssert){return writeDouble(this,value,offset,false,noAssert)}
Buffer.prototype.copy=function copy(target,targetStart,start,end){if(!start)start=0
if(!end&&end!==0)end=this.length
if(targetStart>=target.length)targetStart=target.length
if(!targetStart)targetStart=0
if(end>0&&end<start)end=start
if(end===start)return 0
if(target.length===0||this.length===0)return 0
if(targetStart<0){throw new RangeError('targetStart out of bounds')}
if(start<0||start>=this.length)throw new RangeError('sourceStart out of bounds')
if(end<0)throw new RangeError('sourceEnd out of bounds')
if(end>this.length)end=this.length
if(target.length-targetStart<end-start){end=target.length-targetStart+start}
var len=end-start
var i
if(this===target&&start<targetStart&&targetStart<end){for(i=len-1;i>=0;--i){target[i+targetStart]=this[i+start]}}else if(len<1000||!Buffer.TYPED_ARRAY_SUPPORT){for(i=0;i<len;++i){target[i+targetStart]=this[i+start]}}else{Uint8Array.prototype.set.call(target,this.subarray(start,start+len),targetStart)}
return len}
Buffer.prototype.fill=function fill(val,start,end,encoding){if(typeof val==='string'){if(typeof start==='string'){encoding=start
start=0
end=this.length}else if(typeof end==='string'){encoding=end
end=this.length}
if(val.length===1){var code=val.charCodeAt(0)
if(code<256){val=code}}
if(encoding!==undefined&&typeof encoding!=='string'){throw new TypeError('encoding must be a string')}
if(typeof encoding==='string'&&!Buffer.isEncoding(encoding)){throw new TypeError('Unknown encoding: '+encoding)}}else if(typeof val==='number'){val=val&255}
if(start<0||this.length<start||this.length<end){throw new RangeError('Out of range index')}
if(end<=start){return this}
start=start>>>0
end=end===undefined?this.length:end>>>0
if(!val)val=0
var i
if(typeof val==='number'){for(i=start;i<end;++i){this[i]=val}}else{var bytes=Buffer.isBuffer(val)?val:utf8ToBytes(new Buffer(val,encoding).toString())
var len=bytes.length
for(i=0;i<end-start;++i){this[i+start]=bytes[i%len]}}
return this}
var INVALID_BASE64_RE=/[^+\/0-9A-Za-z-_]/g
function base64clean(str){str=stringtrim(str).replace(INVALID_BASE64_RE,'')
if(str.length<2)return ''
while(str.length%4!==0){str=str+'='}
return str}
function stringtrim(str){if(str.trim)return str.trim()
return str.replace(/^\s+|\s+$/g,'')}
function toHex(n){if(n<16)return '0'+n.toString(16)
return n.toString(16)}
function utf8ToBytes(string,units){units=units||Infinity
var codePoint
var length=string.length
var leadSurrogate=null
var bytes=[]
for(var i=0;i<length;++i){codePoint=string.charCodeAt(i)
if(codePoint>0xD7FF&&codePoint<0xE000){if(!leadSurrogate){if(codePoint>0xDBFF){if((units-=3)>-1)bytes.push(0xEF,0xBF,0xBD)
continue}else if(i+1===length){if((units-=3)>-1)bytes.push(0xEF,0xBF,0xBD)
continue}
leadSurrogate=codePoint
continue}
if(codePoint<0xDC00){if((units-=3)>-1)bytes.push(0xEF,0xBF,0xBD)
leadSurrogate=codePoint
continue}
codePoint=(leadSurrogate-0xD800<<10|codePoint-0xDC00)+0x10000}else if(leadSurrogate){if((units-=3)>-1)bytes.push(0xEF,0xBF,0xBD)}
leadSurrogate=null
if(codePoint<0x80){if((units-=1)<0)break
bytes.push(codePoint)}else if(codePoint<0x800){if((units-=2)<0)break
bytes.push(codePoint>>0x6|0xC0,codePoint&0x3F|0x80)}else if(codePoint<0x10000){if((units-=3)<0)break
bytes.push(codePoint>>0xC|0xE0,codePoint>>0x6&0x3F|0x80,codePoint&0x3F|0x80)}else if(codePoint<0x110000){if((units-=4)<0)break
bytes.push(codePoint>>0x12|0xF0,codePoint>>0xC&0x3F|0x80,codePoint>>0x6&0x3F|0x80,codePoint&0x3F|0x80)}else{throw new Error('Invalid code point')}}
return bytes}
function asciiToBytes(str){var byteArray=[]
for(var i=0;i<str.length;++i){byteArray.push(str.charCodeAt(i)&0xFF)}
return byteArray}
function utf16leToBytes(str,units){var c,hi,lo
var byteArray=[]
for(var i=0;i<str.length;++i){if((units-=2)<0)break
c=str.charCodeAt(i)
hi=c>>8
lo=c%256
byteArray.push(lo)
byteArray.push(hi)}
return byteArray}
function base64ToBytes(str){return base64.toByteArray(base64clean(str))}
function blitBuffer(src,dst,offset,length){for(var i=0;i<length;++i){if((i+offset>=dst.length)||(i>=src.length))break
dst[i+offset]=src[i]}
return i}
function isnan(val){return val!==val}}).call(this,typeof global!=="undefined"?global:typeof self!=="undefined"?self:typeof window!=="undefined"?window:{})},{"base64-js":6,"ieee754":14,"isarray":16}],8:[function(require,module,exports){/*!
* The buffer module from node.js, for the browser.
*
* @author Feross Aboukhadijeh <https://feross.org>
* @license MIT
*/'use strict'
var base64=require('base64-js')
var ieee754=require('ieee754')
exports.Buffer=Buffer
exports.SlowBuffer=SlowBuffer
exports.INSPECT_MAX_BYTES=50
var K_MAX_LENGTH=0x7fffffff
exports.kMaxLength=K_MAX_LENGTH
Buffer.TYPED_ARRAY_SUPPORT=typedArraySupport()
if(!Buffer.TYPED_ARRAY_SUPPORT&&typeof console!=='undefined'&&typeof console.error==='function'){console.error('This browser lacks typed array (Uint8Array) support which is required by '+
'`buffer` v5.x. Use `buffer` v4.x if you require old browser support.')}
function typedArraySupport(){try{var arr=new Uint8Array(1)
arr.__proto__={__proto__:Uint8Array.prototype,foo:function(){return 42}}
return arr.foo()===42}catch(e){return false}}
Object.defineProperty(Buffer.prototype,'parent',{enumerable:true,get:function(){if(!Buffer.isBuffer(this))return undefined
return this.buffer}})
Object.defineProperty(Buffer.prototype,'offset',{enumerable:true,get:function(){if(!Buffer.isBuffer(this))return undefined
return this.byteOffset}})
function createBuffer(length){if(length>K_MAX_LENGTH){throw new RangeError('The value "'+length+'" is invalid for option "size"')}
var buf=new Uint8Array(length)
buf.__proto__=Buffer.prototype
return buf}
function Buffer(arg,encodingOrOffset,length){if(typeof arg==='number'){if(typeof encodingOrOffset==='string'){throw new TypeError('The "string" argument must be of type string. Received type number')}
return allocUnsafe(arg)}
return from(arg,encodingOrOffset,length)}
if(typeof Symbol!=='undefined'&&Symbol.species!=null&&Buffer[Symbol.species]===Buffer){Object.defineProperty(Buffer,Symbol.species,{value:null,configurable:true,enumerable:false,writable:false})}
Buffer.poolSize=8192
function from(value,encodingOrOffset,length){if(typeof value==='string'){return fromString(value,encodingOrOffset)}
if(ArrayBuffer.isView(value)){return fromArrayLike(value)}
if(value==null){throw TypeError('The first argument must be one of type string, Buffer, ArrayBuffer, Array, '+
'or Array-like Object. Received type '+(typeof value))}
if(isInstance(value,ArrayBuffer)||(value&&isInstance(value.buffer,ArrayBuffer))){return fromArrayBuffer(value,encodingOrOffset,length)}
if(typeof value==='number'){throw new TypeError('The "value" argument must not be of type number. Received type number')}
var valueOf=value.valueOf&&value.valueOf()
if(valueOf!=null&&valueOf!==value){return Buffer.from(valueOf,encodingOrOffset,length)}
var b=fromObject(value)
if(b)return b
if(typeof Symbol!=='undefined'&&Symbol.toPrimitive!=null&&typeof value[Symbol.toPrimitive]==='function'){return Buffer.from(value[Symbol.toPrimitive]('string'),encodingOrOffset,length)}
throw new TypeError('The first argument must be one of type string, Buffer, ArrayBuffer, Array, '+
'or Array-like Object. Received type '+(typeof value))}
Buffer.from=function(value,encodingOrOffset,length){return from(value,encodingOrOffset,length)}
Buffer.prototype.__proto__=Uint8Array.prototype
Buffer.__proto__=Uint8Array
function assertSize(size){if(typeof size!=='number'){throw new TypeError('"size" argument must be of type number')}else if(size<0){throw new RangeError('The value "'+size+'" is invalid for option "size"')}}
function alloc(size,fill,encoding){assertSize(size)
if(size<=0){return createBuffer(size)}
if(fill!==undefined){return typeof encoding==='string'?createBuffer(size).fill(fill,encoding):createBuffer(size).fill(fill)}
return createBuffer(size)}
Buffer.alloc=function(size,fill,encoding){return alloc(size,fill,encoding)}
function allocUnsafe(size){assertSize(size)
return createBuffer(size<0?0:checked(size)|0)}
Buffer.allocUnsafe=function(size){return allocUnsafe(size)}
Buffer.allocUnsafeSlow=function(size){return allocUnsafe(size)}
function fromString(string,encoding){if(typeof encoding!=='string'||encoding===''){encoding='utf8'}
if(!Buffer.isEncoding(encoding)){throw new TypeError('Unknown encoding: '+encoding)}
var length=byteLength(string,encoding)|0
var buf=createBuffer(length)
var actual=buf.write(string,encoding)
if(actual!==length){buf=buf.slice(0,actual)}
return buf}
function fromArrayLike(array){var length=array.length<0?0:checked(array.length)|0
var buf=createBuffer(length)
for(var i=0;i<length;i+=1){buf[i]=array[i]&255}
return buf}
function fromArrayBuffer(array,byteOffset,length){if(byteOffset<0||array.byteLength<byteOffset){throw new RangeError('"offset" is outside of buffer bounds')}
if(array.byteLength<byteOffset+(length||0)){throw new RangeError('"length" is outside of buffer bounds')}
var buf
if(byteOffset===undefined&&length===undefined){buf=new Uint8Array(array)}else if(length===undefined){buf=new Uint8Array(array,byteOffset)}else{buf=new Uint8Array(array,byteOffset,length)}
buf.__proto__=Buffer.prototype
return buf}
function fromObject(obj){if(Buffer.isBuffer(obj)){var len=checked(obj.length)|0
var buf=createBuffer(len)
if(buf.length===0){return buf}
obj.copy(buf,0,0,len)
return buf}
if(obj.length!==undefined){if(typeof obj.length!=='number'||numberIsNaN(obj.length)){return createBuffer(0)}
return fromArrayLike(obj)}
if(obj.type==='Buffer'&&Array.isArray(obj.data)){return fromArrayLike(obj.data)}}
function checked(length){if(length>=K_MAX_LENGTH){throw new RangeError('Attempt to allocate Buffer larger than maximum '+
'size: 0x'+K_MAX_LENGTH.toString(16)+' bytes')}
return length|0}
function SlowBuffer(length){if(+length!=length){length=0}
return Buffer.alloc(+length)}
Buffer.isBuffer=function isBuffer(b){return b!=null&&b._isBuffer===true&&b!==Buffer.prototype}
Buffer.compare=function compare(a,b){if(isInstance(a,Uint8Array))a=Buffer.from(a,a.offset,a.byteLength)
if(isInstance(b,Uint8Array))b=Buffer.from(b,b.offset,b.byteLength)
if(!Buffer.isBuffer(a)||!Buffer.isBuffer(b)){throw new TypeError('The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array')}
if(a===b)return 0
var x=a.length
var y=b.length
for(var i=0,len=Math.min(x,y);i<len;++i){if(a[i]!==b[i]){x=a[i]
y=b[i]
break}}
if(x<y)return-1
if(y<x)return 1
return 0}
Buffer.isEncoding=function isEncoding(encoding){switch(String(encoding).toLowerCase()){case 'hex':case 'utf8':case 'utf-8':case 'ascii':case 'latin1':case 'binary':case 'base64':case 'ucs2':case 'ucs-2':case 'utf16le':case 'utf-16le':return true
default:return false}}
Buffer.concat=function concat(list,length){if(!Array.isArray(list)){throw new TypeError('"list" argument must be an Array of Buffers')}
if(list.length===0){return Buffer.alloc(0)}
var i
if(length===undefined){length=0
for(i=0;i<list.length;++i){length+=list[i].length}}
var buffer=Buffer.allocUnsafe(length)
var pos=0
for(i=0;i<list.length;++i){var buf=list[i]
if(isInstance(buf,Uint8Array)){buf=Buffer.from(buf)}
if(!Buffer.isBuffer(buf)){throw new TypeError('"list" argument must be an Array of Buffers')}
buf.copy(buffer,pos)
pos+=buf.length}
return buffer}
function byteLength(string,encoding){if(Buffer.isBuffer(string)){return string.length}
if(ArrayBuffer.isView(string)||isInstance(string,ArrayBuffer)){return string.byteLength}
if(typeof string!=='string'){throw new TypeError('The "string" argument must be one of type string, Buffer, or ArrayBuffer. '+
'Received type '+typeof string)}
var len=string.length
var mustMatch=(arguments.length>2&&arguments[2]===true)
if(!mustMatch&&len===0)return 0
var loweredCase=false
for(;;){switch(encoding){case 'ascii':case 'latin1':case 'binary':return len
case 'utf8':case 'utf-8':return utf8ToBytes(string).length
case 'ucs2':case 'ucs-2':case 'utf16le':case 'utf-16le':return len*2
case 'hex':return len>>>1
case 'base64':return base64ToBytes(string).length
default:if(loweredCase){return mustMatch?-1:utf8ToBytes(string).length}
encoding=(''+encoding).toLowerCase()
loweredCase=true}}}
Buffer.byteLength=byteLength
function slowToString(encoding,start,end){var loweredCase=false
if(start===undefined||start<0){start=0}
if(start>this.length){return ''}
if(end===undefined||end>this.length){end=this.length}
if(end<=0){return ''}
end>>>=0
start>>>=0
if(end<=start){return ''}
if(!encoding)encoding='utf8'
while(true){switch(encoding){case 'hex':return hexSlice(this,start,end)
case 'utf8':case 'utf-8':return utf8Slice(this,start,end)
case 'ascii':return asciiSlice(this,start,end)
case 'latin1':case 'binary':return latin1Slice(this,start,end)
case 'base64':return base64Slice(this,start,end)
case 'ucs2':case 'ucs-2':case 'utf16le':case 'utf-16le':return utf16leSlice(this,start,end)
default:if(loweredCase)throw new TypeError('Unknown encoding: '+encoding)
encoding=(encoding+'').toLowerCase()
loweredCase=true}}}
Buffer.prototype._isBuffer=true
function swap(b,n,m){var i=b[n]
b[n]=b[m]
b[m]=i}
Buffer.prototype.swap16=function swap16(){var len=this.length
if(len%2!==0){throw new RangeError('Buffer size must be a multiple of 16-bits')}
for(var i=0;i<len;i+=2){swap(this,i,i+1)}
return this}
Buffer.prototype.swap32=function swap32(){var len=this.length
if(len%4!==0){throw new RangeError('Buffer size must be a multiple of 32-bits')}
for(var i=0;i<len;i+=4){swap(this,i,i+3)
swap(this,i+1,i+2)}
return this}
Buffer.prototype.swap64=function swap64(){var len=this.length
if(len%8!==0){throw new RangeError('Buffer size must be a multiple of 64-bits')}
for(var i=0;i<len;i+=8){swap(this,i,i+7)
swap(this,i+1,i+6)
swap(this,i+2,i+5)
swap(this,i+3,i+4)}
return this}
Buffer.prototype.toString=function toString(){var length=this.length
if(length===0)return ''
if(arguments.length===0)return utf8Slice(this,0,length)
return slowToString.apply(this,arguments)}
Buffer.prototype.toLocaleString=Buffer.prototype.toString
Buffer.prototype.equals=function equals(b){if(!Buffer.isBuffer(b))throw new TypeError('Argument must be a Buffer')
if(this===b)return true
return Buffer.compare(this,b)===0}
Buffer.prototype.inspect=function inspect(){var str=''
var max=exports.INSPECT_MAX_BYTES
str=this.toString('hex',0,max).replace(/(.{2})/g,'$1 ').trim()
if(this.length>max)str+=' ... '
return '<Buffer '+str+'>'}
Buffer.prototype.compare=function compare(target,start,end,thisStart,thisEnd){if(isInstance(target,Uint8Array)){target=Buffer.from(target,target.offset,target.byteLength)}
if(!Buffer.isBuffer(target)){throw new TypeError('The "target" argument must be one of type Buffer or Uint8Array. '+
'Received type '+(typeof target))}
if(start===undefined){start=0}
if(end===undefined){end=target?target.length:0}
if(thisStart===undefined){thisStart=0}
if(thisEnd===undefined){thisEnd=this.length}
if(start<0||end>target.length||thisStart<0||thisEnd>this.length){throw new RangeError('out of range index')}
if(thisStart>=thisEnd&&start>=end){return 0}
if(thisStart>=thisEnd){return-1}
if(start>=end){return 1}
start>>>=0
end>>>=0
thisStart>>>=0
thisEnd>>>=0
if(this===target)return 0
var x=thisEnd-thisStart
var y=end-start
var len=Math.min(x,y)
var thisCopy=this.slice(thisStart,thisEnd)
var targetCopy=target.slice(start,end)
for(var i=0;i<len;++i){if(thisCopy[i]!==targetCopy[i]){x=thisCopy[i]
y=targetCopy[i]
break}}
if(x<y)return-1
if(y<x)return 1
return 0}
function bidirectionalIndexOf(buffer,val,byteOffset,encoding,dir){if(buffer.length===0)return-1
if(typeof byteOffset==='string'){encoding=byteOffset
byteOffset=0}else if(byteOffset>0x7fffffff){byteOffset=0x7fffffff}else if(byteOffset<-0x80000000){byteOffset=-0x80000000}
byteOffset=+byteOffset
if(numberIsNaN(byteOffset)){byteOffset=dir?0:(buffer.length-1)}
if(byteOffset<0)byteOffset=buffer.length+byteOffset
if(byteOffset>=buffer.length){if(dir)return-1
else byteOffset=buffer.length-1}else if(byteOffset<0){if(dir)byteOffset=0
else return-1}
if(typeof val==='string'){val=Buffer.from(val,encoding)}
if(Buffer.isBuffer(val)){if(val.length===0){return-1}
return arrayIndexOf(buffer,val,byteOffset,encoding,dir)}else if(typeof val==='number'){val=val&0xFF
if(typeof Uint8Array.prototype.indexOf==='function'){if(dir){return Uint8Array.prototype.indexOf.call(buffer,val,byteOffset)}else{return Uint8Array.prototype.lastIndexOf.call(buffer,val,byteOffset)}}
return arrayIndexOf(buffer,[val],byteOffset,encoding,dir)}
throw new TypeError('val must be string, number or Buffer')}
function arrayIndexOf(arr,val,byteOffset,encoding,dir){var indexSize=1
var arrLength=arr.length
var valLength=val.length
if(encoding!==undefined){encoding=String(encoding).toLowerCase()
if(encoding==='ucs2'||encoding==='ucs-2'||encoding==='utf16le'||encoding==='utf-16le'){if(arr.length<2||val.length<2){return-1}
indexSize=2
arrLength/=2
valLength/=2
byteOffset/=2}}
function read(buf,i){if(indexSize===1){return buf[i]}else{return buf.readUInt16BE(i*indexSize)}}
var i
if(dir){var foundIndex=-1
for(i=byteOffset;i<arrLength;i++){if(read(arr,i)===read(val,foundIndex===-1?0:i-foundIndex)){if(foundIndex===-1)foundIndex=i
if(i-foundIndex+1===valLength)return foundIndex*indexSize}else{if(foundIndex!==-1)i-=i-foundIndex
foundIndex=-1}}}else{if(byteOffset+valLength>arrLength)byteOffset=arrLength-valLength
for(i=byteOffset;i>=0;i--){var found=true
for(var j=0;j<valLength;j++){if(read(arr,i+j)!==read(val,j)){found=false
break}}
if(found)return i}}
return-1}
Buffer.prototype.includes=function includes(val,byteOffset,encoding){return this.indexOf(val,byteOffset,encoding)!==-1}
Buffer.prototype.indexOf=function indexOf(val,byteOffset,encoding){return bidirectionalIndexOf(this,val,byteOffset,encoding,true)}
Buffer.prototype.lastIndexOf=function lastIndexOf(val,byteOffset,encoding){return bidirectionalIndexOf(this,val,byteOffset,encoding,false)}
function hexWrite(buf,string,offset,length){offset=Number(offset)||0
var remaining=buf.length-offset
if(!length){length=remaining}else{length=Number(length)
if(length>remaining){length=remaining}}
var strLen=string.length
if(length>strLen/2){length=strLen/2}
for(var i=0;i<length;++i){var parsed=parseInt(string.substr(i*2,2),16)
if(numberIsNaN(parsed))return i
buf[offset+i]=parsed}
return i}
function utf8Write(buf,string,offset,length){return blitBuffer(utf8ToBytes(string,buf.length-offset),buf,offset,length)}
function asciiWrite(buf,string,offset,length){return blitBuffer(asciiToBytes(string),buf,offset,length)}
function latin1Write(buf,string,offset,length){return asciiWrite(buf,string,offset,length)}
function base64Write(buf,string,offset,length){return blitBuffer(base64ToBytes(string),buf,offset,length)}
function ucs2Write(buf,string,offset,length){return blitBuffer(utf16leToBytes(string,buf.length-offset),buf,offset,length)}
Buffer.prototype.write=function write(string,offset,length,encoding){if(offset===undefined){encoding='utf8'
length=this.length
offset=0}else if(length===undefined&&typeof offset==='string'){encoding=offset
length=this.length
offset=0}else if(isFinite(offset)){offset=offset>>>0
if(isFinite(length)){length=length>>>0
if(encoding===undefined)encoding='utf8'}else{encoding=length
length=undefined}}else{throw new Error('Buffer.write(string, encoding, offset[, length]) is no longer supported')}
var remaining=this.length-offset
if(length===undefined||length>remaining)length=remaining
if((string.length>0&&(length<0||offset<0))||offset>this.length){throw new RangeError('Attempt to write outside buffer bounds')}
if(!encoding)encoding='utf8'
var loweredCase=false
for(;;){switch(encoding){case 'hex':return hexWrite(this,string,offset,length)
case 'utf8':case 'utf-8':return utf8Write(this,string,offset,length)
case 'ascii':return asciiWrite(this,string,offset,length)
case 'latin1':case 'binary':return latin1Write(this,string,offset,length)
case 'base64':return base64Write(this,string,offset,length)
case 'ucs2':case 'ucs-2':case 'utf16le':case 'utf-16le':return ucs2Write(this,string,offset,length)
default:if(loweredCase)throw new TypeError('Unknown encoding: '+encoding)
encoding=(''+encoding).toLowerCase()
loweredCase=true}}}
Buffer.prototype.toJSON=function toJSON(){return{type:'Buffer',data:Array.prototype.slice.call(this._arr||this,0)}}
function base64Slice(buf,start,end){if(start===0&&end===buf.length){return base64.fromByteArray(buf)}else{return base64.fromByteArray(buf.slice(start,end))}}
function utf8Slice(buf,start,end){end=Math.min(buf.length,end)
var res=[]
var i=start
while(i<end){var firstByte=buf[i]
var codePoint=null
var bytesPerSequence=(firstByte>0xEF)?4:(firstByte>0xDF)?3:(firstByte>0xBF)?2:1
if(i+bytesPerSequence<=end){var secondByte,thirdByte,fourthByte,tempCodePoint
switch(bytesPerSequence){case 1:if(firstByte<0x80){codePoint=firstByte}
break
case 2:secondByte=buf[i+1]
if((secondByte&0xC0)===0x80){tempCodePoint=(firstByte&0x1F)<<0x6|(secondByte&0x3F)
if(tempCodePoint>0x7F){codePoint=tempCodePoint}}
break
case 3:secondByte=buf[i+1]
thirdByte=buf[i+2]
if((secondByte&0xC0)===0x80&&(thirdByte&0xC0)===0x80){tempCodePoint=(firstByte&0xF)<<0xC|(secondByte&0x3F)<<0x6|(thirdByte&0x3F)
if(tempCodePoint>0x7FF&&(tempCodePoint<0xD800||tempCodePoint>0xDFFF)){codePoint=tempCodePoint}}
break
case 4:secondByte=buf[i+1]
thirdByte=buf[i+2]
fourthByte=buf[i+3]
if((secondByte&0xC0)===0x80&&(thirdByte&0xC0)===0x80&&(fourthByte&0xC0)===0x80){tempCodePoint=(firstByte&0xF)<<0x12|(secondByte&0x3F)<<0xC|(thirdByte&0x3F)<<0x6|(fourthByte&0x3F)
if(tempCodePoint>0xFFFF&&tempCodePoint<0x110000){codePoint=tempCodePoint}}}}
if(codePoint===null){codePoint=0xFFFD
bytesPerSequence=1}else if(codePoint>0xFFFF){codePoint-=0x10000
res.push(codePoint>>>10&0x3FF|0xD800)
codePoint=0xDC00|codePoint&0x3FF}
res.push(codePoint)
i+=bytesPerSequence}
return decodeCodePointsArray(res)}
var MAX_ARGUMENTS_LENGTH=0x1000
function decodeCodePointsArray(codePoints){var len=codePoints.length
if(len<=MAX_ARGUMENTS_LENGTH){return String.fromCharCode.apply(String,codePoints)}
var res=''
var i=0
while(i<len){res+=String.fromCharCode.apply(String,codePoints.slice(i,i+=MAX_ARGUMENTS_LENGTH))}
return res}
function asciiSlice(buf,start,end){var ret=''
end=Math.min(buf.length,end)
for(var i=start;i<end;++i){ret+=String.fromCharCode(buf[i]&0x7F)}
return ret}
function latin1Slice(buf,start,end){var ret=''
end=Math.min(buf.length,end)
for(var i=start;i<end;++i){ret+=String.fromCharCode(buf[i])}
return ret}
function hexSlice(buf,start,end){var len=buf.length
if(!start||start<0)start=0
if(!end||end<0||end>len)end=len
var out=''
for(var i=start;i<end;++i){out+=toHex(buf[i])}
return out}
function utf16leSlice(buf,start,end){var bytes=buf.slice(start,end)
var res=''
for(var i=0;i<bytes.length;i+=2){res+=String.fromCharCode(bytes[i]+(bytes[i+1]*256))}
return res}
Buffer.prototype.slice=function slice(start,end){var len=this.length
start=~~start
end=end===undefined?len:~~end
if(start<0){start+=len
if(start<0)start=0}else if(start>len){start=len}
if(end<0){end+=len
if(end<0)end=0}else if(end>len){end=len}
if(end<start)end=start
var newBuf=this.subarray(start,end)
newBuf.__proto__=Buffer.prototype
return newBuf}
function checkOffset(offset,ext,length){if((offset%1)!==0||offset<0)throw new RangeError('offset is not uint')
if(offset+ext>length)throw new RangeError('Trying to access beyond buffer length')}
Buffer.prototype.readUIntLE=function readUIntLE(offset,byteLength,noAssert){offset=offset>>>0
byteLength=byteLength>>>0
if(!noAssert)checkOffset(offset,byteLength,this.length)
var val=this[offset]
var mul=1
var i=0
while(++i<byteLength&&(mul*=0x100)){val+=this[offset+i]*mul}
return val}
Buffer.prototype.readUIntBE=function readUIntBE(offset,byteLength,noAssert){offset=offset>>>0
byteLength=byteLength>>>0
if(!noAssert){checkOffset(offset,byteLength,this.length)}
var val=this[offset+--byteLength]
var mul=1
while(byteLength>0&&(mul*=0x100)){val+=this[offset+--byteLength]*mul}
return val}
Buffer.prototype.readUInt8=function readUInt8(offset,noAssert){offset=offset>>>0
if(!noAssert)checkOffset(offset,1,this.length)
return this[offset]}
Buffer.prototype.readUInt16LE=function readUInt16LE(offset,noAssert){offset=offset>>>0
if(!noAssert)checkOffset(offset,2,this.length)
return this[offset]|(this[offset+1]<<8)}
Buffer.prototype.readUInt16BE=function readUInt16BE(offset,noAssert){offset=offset>>>0
if(!noAssert)checkOffset(offset,2,this.length)
return(this[offset]<<8)|this[offset+1]}
Buffer.prototype.readUInt32LE=function readUInt32LE(offset,noAssert){offset=offset>>>0
if(!noAssert)checkOffset(offset,4,this.length)
return((this[offset])|(this[offset+1]<<8)|(this[offset+2]<<16))+
(this[offset+3]*0x1000000)}
Buffer.prototype.readUInt32BE=function readUInt32BE(offset,noAssert){offset=offset>>>0
if(!noAssert)checkOffset(offset,4,this.length)
return(this[offset]*0x1000000)+
((this[offset+1]<<16)|(this[offset+2]<<8)|this[offset+3])}
Buffer.prototype.readIntLE=function readIntLE(offset,byteLength,noAssert){offset=offset>>>0
byteLength=byteLength>>>0
if(!noAssert)checkOffset(offset,byteLength,this.length)
var val=this[offset]
var mul=1
var i=0
while(++i<byteLength&&(mul*=0x100)){val+=this[offset+i]*mul}
mul*=0x80
if(val>=mul)val-=Math.pow(2,8*byteLength)
return val}
Buffer.prototype.readIntBE=function readIntBE(offset,byteLength,noAssert){offset=offset>>>0
byteLength=byteLength>>>0
if(!noAssert)checkOffset(offset,byteLength,this.length)
var i=byteLength
var mul=1
var val=this[offset+--i]
while(i>0&&(mul*=0x100)){val+=this[offset+--i]*mul}
mul*=0x80
if(val>=mul)val-=Math.pow(2,8*byteLength)
return val}
Buffer.prototype.readInt8=function readInt8(offset,noAssert){offset=offset>>>0
if(!noAssert)checkOffset(offset,1,this.length)
if(!(this[offset]&0x80))return(this[offset])
return((0xff-this[offset]+1)*-1)}
Buffer.prototype.readInt16LE=function readInt16LE(offset,noAssert){offset=offset>>>0
if(!noAssert)checkOffset(offset,2,this.length)
var val=this[offset]|(this[offset+1]<<8)
return(val&0x8000)?val|0xFFFF0000:val}
Buffer.prototype.readInt16BE=function readInt16BE(offset,noAssert){offset=offset>>>0
if(!noAssert)checkOffset(offset,2,this.length)
var val=this[offset+1]|(this[offset]<<8)
return(val&0x8000)?val|0xFFFF0000:val}
Buffer.prototype.readInt32LE=function readInt32LE(offset,noAssert){offset=offset>>>0
if(!noAssert)checkOffset(offset,4,this.length)
return(this[offset])|(this[offset+1]<<8)|(this[offset+2]<<16)|(this[offset+3]<<24)}
Buffer.prototype.readInt32BE=function readInt32BE(offset,noAssert){offset=offset>>>0
if(!noAssert)checkOffset(offset,4,this.length)
return(this[offset]<<24)|(this[offset+1]<<16)|(this[offset+2]<<8)|(this[offset+3])}
Buffer.prototype.readFloatLE=function readFloatLE(offset,noAssert){offset=offset>>>0
if(!noAssert)checkOffset(offset,4,this.length)
return ieee754.read(this,offset,true,23,4)}
Buffer.prototype.readFloatBE=function readFloatBE(offset,noAssert){offset=offset>>>0
if(!noAssert)checkOffset(offset,4,this.length)
return ieee754.read(this,offset,false,23,4)}
Buffer.prototype.readDoubleLE=function readDoubleLE(offset,noAssert){offset=offset>>>0
if(!noAssert)checkOffset(offset,8,this.length)
return ieee754.read(this,offset,true,52,8)}
Buffer.prototype.readDoubleBE=function readDoubleBE(offset,noAssert){offset=offset>>>0
if(!noAssert)checkOffset(offset,8,this.length)
return ieee754.read(this,offset,false,52,8)}
function checkInt(buf,value,offset,ext,max,min){if(!Buffer.isBuffer(buf))throw new TypeError('"buffer" argument must be a Buffer instance')
if(value>max||value<min)throw new RangeError('"value" argument is out of bounds')
if(offset+ext>buf.length)throw new RangeError('Index out of range')}
Buffer.prototype.writeUIntLE=function writeUIntLE(value,offset,byteLength,noAssert){value=+value
offset=offset>>>0
byteLength=byteLength>>>0
if(!noAssert){var maxBytes=Math.pow(2,8*byteLength)-1
checkInt(this,value,offset,byteLength,maxBytes,0)}
var mul=1
var i=0
this[offset]=value&0xFF
while(++i<byteLength&&(mul*=0x100)){this[offset+i]=(value/mul)&0xFF}
return offset+byteLength}
Buffer.prototype.writeUIntBE=function writeUIntBE(value,offset,byteLength,noAssert){value=+value
offset=offset>>>0
byteLength=byteLength>>>0
if(!noAssert){var maxBytes=Math.pow(2,8*byteLength)-1
checkInt(this,value,offset,byteLength,maxBytes,0)}
var i=byteLength-1
var mul=1
this[offset+i]=value&0xFF
while(--i>=0&&(mul*=0x100)){this[offset+i]=(value/mul)&0xFF}
return offset+byteLength}
Buffer.prototype.writeUInt8=function writeUInt8(value,offset,noAssert){value=+value
offset=offset>>>0
if(!noAssert)checkInt(this,value,offset,1,0xff,0)
this[offset]=(value&0xff)
return offset+1}
Buffer.prototype.writeUInt16LE=function writeUInt16LE(value,offset,noAssert){value=+value
offset=offset>>>0
if(!noAssert)checkInt(this,value,offset,2,0xffff,0)
this[offset]=(value&0xff)
this[offset+1]=(value>>>8)
return offset+2}
Buffer.prototype.writeUInt16BE=function writeUInt16BE(value,offset,noAssert){value=+value
offset=offset>>>0
if(!noAssert)checkInt(this,value,offset,2,0xffff,0)
this[offset]=(value>>>8)
this[offset+1]=(value&0xff)
return offset+2}
Buffer.prototype.writeUInt32LE=function writeUInt32LE(value,offset,noAssert){value=+value
offset=offset>>>0
if(!noAssert)checkInt(this,value,offset,4,0xffffffff,0)
this[offset+3]=(value>>>24)
this[offset+2]=(value>>>16)
this[offset+1]=(value>>>8)
this[offset]=(value&0xff)
return offset+4}
Buffer.prototype.writeUInt32BE=function writeUInt32BE(value,offset,noAssert){value=+value
offset=offset>>>0
if(!noAssert)checkInt(this,value,offset,4,0xffffffff,0)
this[offset]=(value>>>24)
this[offset+1]=(value>>>16)
this[offset+2]=(value>>>8)
this[offset+3]=(value&0xff)
return offset+4}
Buffer.prototype.writeIntLE=function writeIntLE(value,offset,byteLength,noAssert){value=+value
offset=offset>>>0
if(!noAssert){var limit=Math.pow(2,(8*byteLength)-1)
checkInt(this,value,offset,byteLength,limit-1,-limit)}
var i=0
var mul=1
var sub=0
this[offset]=value&0xFF
while(++i<byteLength&&(mul*=0x100)){if(value<0&&sub===0&&this[offset+i-1]!==0){sub=1}
this[offset+i]=((value/mul)>>0)-sub&0xFF}
return offset+byteLength}
Buffer.prototype.writeIntBE=function writeIntBE(value,offset,byteLength,noAssert){value=+value
offset=offset>>>0
if(!noAssert){var limit=Math.pow(2,(8*byteLength)-1)
checkInt(this,value,offset,byteLength,limit-1,-limit)}
var i=byteLength-1
var mul=1
var sub=0
this[offset+i]=value&0xFF
while(--i>=0&&(mul*=0x100)){if(value<0&&sub===0&&this[offset+i+1]!==0){sub=1}
this[offset+i]=((value/mul)>>0)-sub&0xFF}
return offset+byteLength}
Buffer.prototype.writeInt8=function writeInt8(value,offset,noAssert){value=+value
offset=offset>>>0
if(!noAssert)checkInt(this,value,offset,1,0x7f,-0x80)
if(value<0)value=0xff+value+1
this[offset]=(value&0xff)
return offset+1}
Buffer.prototype.writeInt16LE=function writeInt16LE(value,offset,noAssert){value=+value
offset=offset>>>0
if(!noAssert)checkInt(this,value,offset,2,0x7fff,-0x8000)
this[offset]=(value&0xff)
this[offset+1]=(value>>>8)
return offset+2}
Buffer.prototype.writeInt16BE=function writeInt16BE(value,offset,noAssert){value=+value
offset=offset>>>0
if(!noAssert)checkInt(this,value,offset,2,0x7fff,-0x8000)
this[offset]=(value>>>8)
this[offset+1]=(value&0xff)
return offset+2}
Buffer.prototype.writeInt32LE=function writeInt32LE(value,offset,noAssert){value=+value
offset=offset>>>0
if(!noAssert)checkInt(this,value,offset,4,0x7fffffff,-0x80000000)
this[offset]=(value&0xff)
this[offset+1]=(value>>>8)
this[offset+2]=(value>>>16)
this[offset+3]=(value>>>24)
return offset+4}
Buffer.prototype.writeInt32BE=function writeInt32BE(value,offset,noAssert){value=+value
offset=offset>>>0
if(!noAssert)checkInt(this,value,offset,4,0x7fffffff,-0x80000000)
if(value<0)value=0xffffffff+value+1
this[offset]=(value>>>24)
this[offset+1]=(value>>>16)
this[offset+2]=(value>>>8)
this[offset+3]=(value&0xff)
return offset+4}
function checkIEEE754(buf,value,offset,ext,max,min){if(offset+ext>buf.length)throw new RangeError('Index out of range')
if(offset<0)throw new RangeError('Index out of range')}
function writeFloat(buf,value,offset,littleEndian,noAssert){value=+value
offset=offset>>>0
if(!noAssert){checkIEEE754(buf,value,offset,4,3.4028234663852886e+38,-3.4028234663852886e+38)}
ieee754.write(buf,value,offset,littleEndian,23,4)
return offset+4}
Buffer.prototype.writeFloatLE=function writeFloatLE(value,offset,noAssert){return writeFloat(this,value,offset,true,noAssert)}
Buffer.prototype.writeFloatBE=function writeFloatBE(value,offset,noAssert){return writeFloat(this,value,offset,false,noAssert)}
function writeDouble(buf,value,offset,littleEndian,noAssert){value=+value
offset=offset>>>0
if(!noAssert){checkIEEE754(buf,value,offset,8,1.7976931348623157E+308,-1.7976931348623157E+308)}
ieee754.write(buf,value,offset,littleEndian,52,8)
return offset+8}
Buffer.prototype.writeDoubleLE=function writeDoubleLE(value,offset,noAssert){return writeDouble(this,value,offset,true,noAssert)}
Buffer.prototype.writeDoubleBE=function writeDoubleBE(value,offset,noAssert){return writeDouble(this,value,offset,false,noAssert)}
Buffer.prototype.copy=function copy(target,targetStart,start,end){if(!Buffer.isBuffer(target))throw new TypeError('argument should be a Buffer')
if(!start)start=0
if(!end&&end!==0)end=this.length
if(targetStart>=target.length)targetStart=target.length
if(!targetStart)targetStart=0
if(end>0&&end<start)end=start
if(end===start)return 0
if(target.length===0||this.length===0)return 0
if(targetStart<0){throw new RangeError('targetStart out of bounds')}
if(start<0||start>=this.length)throw new RangeError('Index out of range')
if(end<0)throw new RangeError('sourceEnd out of bounds')
if(end>this.length)end=this.length
if(target.length-targetStart<end-start){end=target.length-targetStart+start}
var len=end-start
if(this===target&&typeof Uint8Array.prototype.copyWithin==='function'){this.copyWithin(targetStart,start,end)}else if(this===target&&start<targetStart&&targetStart<end){for(var i=len-1;i>=0;--i){target[i+targetStart]=this[i+start]}}else{Uint8Array.prototype.set.call(target,this.subarray(start,end),targetStart)}
return len}
Buffer.prototype.fill=function fill(val,start,end,encoding){if(typeof val==='string'){if(typeof start==='string'){encoding=start
start=0
end=this.length}else if(typeof end==='string'){encoding=end
end=this.length}
if(encoding!==undefined&&typeof encoding!=='string'){throw new TypeError('encoding must be a string')}
if(typeof encoding==='string'&&!Buffer.isEncoding(encoding)){throw new TypeError('Unknown encoding: '+encoding)}
if(val.length===1){var code=val.charCodeAt(0)
if((encoding==='utf8'&&code<128)||encoding==='latin1'){val=code}}}else if(typeof val==='number'){val=val&255}
if(start<0||this.length<start||this.length<end){throw new RangeError('Out of range index')}
if(end<=start){return this}
start=start>>>0
end=end===undefined?this.length:end>>>0
if(!val)val=0
var i
if(typeof val==='number'){for(i=start;i<end;++i){this[i]=val}}else{var bytes=Buffer.isBuffer(val)?val:Buffer.from(val,encoding)
var len=bytes.length
if(len===0){throw new TypeError('The value "'+val+
'" is invalid for argument "value"')}
for(i=0;i<end-start;++i){this[i+start]=bytes[i%len]}}
return this}
var INVALID_BASE64_RE=/[^+/0-9A-Za-z-_]/g
function base64clean(str){str=str.split('=')[0]
str=str.trim().replace(INVALID_BASE64_RE,'')
if(str.length<2)return ''
while(str.length%4!==0){str=str+'='}
return str}
function toHex(n){if(n<16)return '0'+n.toString(16)
return n.toString(16)}
function utf8ToBytes(string,units){units=units||Infinity
var codePoint
var length=string.length
var leadSurrogate=null
var bytes=[]
for(var i=0;i<length;++i){codePoint=string.charCodeAt(i)
if(codePoint>0xD7FF&&codePoint<0xE000){if(!leadSurrogate){if(codePoint>0xDBFF){if((units-=3)>-1)bytes.push(0xEF,0xBF,0xBD)
continue}else if(i+1===length){if((units-=3)>-1)bytes.push(0xEF,0xBF,0xBD)
continue}
leadSurrogate=codePoint
continue}
if(codePoint<0xDC00){if((units-=3)>-1)bytes.push(0xEF,0xBF,0xBD)
leadSurrogate=codePoint
continue}
codePoint=(leadSurrogate-0xD800<<10|codePoint-0xDC00)+0x10000}else if(leadSurrogate){if((units-=3)>-1)bytes.push(0xEF,0xBF,0xBD)}
leadSurrogate=null
if(codePoint<0x80){if((units-=1)<0)break
bytes.push(codePoint)}else if(codePoint<0x800){if((units-=2)<0)break
bytes.push(codePoint>>0x6|0xC0,codePoint&0x3F|0x80)}else if(codePoint<0x10000){if((units-=3)<0)break
bytes.push(codePoint>>0xC|0xE0,codePoint>>0x6&0x3F|0x80,codePoint&0x3F|0x80)}else if(codePoint<0x110000){if((units-=4)<0)break
bytes.push(codePoint>>0x12|0xF0,codePoint>>0xC&0x3F|0x80,codePoint>>0x6&0x3F|0x80,codePoint&0x3F|0x80)}else{throw new Error('Invalid code point')}}
return bytes}
function asciiToBytes(str){var byteArray=[]
for(var i=0;i<str.length;++i){byteArray.push(str.charCodeAt(i)&0xFF)}
return byteArray}
function utf16leToBytes(str,units){var c,hi,lo
var byteArray=[]
for(var i=0;i<str.length;++i){if((units-=2)<0)break
c=str.charCodeAt(i)
hi=c>>8
lo=c%256
byteArray.push(lo)
byteArray.push(hi)}
return byteArray}
function base64ToBytes(str){return base64.toByteArray(base64clean(str))}
function blitBuffer(src,dst,offset,length){for(var i=0;i<length;++i){if((i+offset>=dst.length)||(i>=src.length))break
dst[i+offset]=src[i]}
return i}
function isInstance(obj,type){return obj instanceof type||(obj!=null&&obj.constructor!=null&&obj.constructor.name!=null&&obj.constructor.name===type.name)}
function numberIsNaN(obj){return obj!==obj}},{"base64-js":6,"ieee754":14}],9:[function(require,module,exports){var BufferReader=require('./lib/buffer-reader')
var XIPH_LACING=1
var EBML_LACING=3
var FIXED_SIZE_LACING=2
module.exports=function(buffer){var block={}
var reader=new BufferReader(buffer)
block.trackNumber=reader.nextUIntV()
block.timecode=reader.nextInt16BE()
var flags=reader.nextUInt8()
block.invisible=!!(flags&0x8)
block.keyframe=!!(flags&0x80)
block.discardable=!!(flags&0x1)
var lacing=(flags&0x6)>>1
block.frames=readLacedData(reader,lacing)
return block}
function readLacedData(reader,lacing){if(!lacing)return[reader.nextBuffer()]
var i,frameSize
var frames=[]
var framesNum=reader.nextUInt8()+1
if(lacing===FIXED_SIZE_LACING){if(reader.length%framesNum!==0)throw new Error('Fixed-Size Lacing Error')
frameSize=reader.length/framesNum
for(i=0;i<framesNum;i++){frames.push(reader.nextBuffer(frameSize))}
return frames}
var frameSizes=[]
if(lacing===XIPH_LACING){for(i=0;i<framesNum-1;i++){var val
frameSize=0
do{val=reader.nextUInt8()
frameSize+=val}while(val===0xff)
frameSizes.push(frameSize)}}else if(lacing===EBML_LACING){frameSize=reader.nextUIntV()
frameSizes.push(frameSize)
for(i=1;i<framesNum-1;i++){frameSize+=reader.nextIntV()
frameSizes.push(frameSize)}}
for(i=0;i<framesNum-1;i++){frames.push(reader.nextBuffer(frameSizes[i]))}
frames.push(reader.nextBuffer())
return frames}},{"./lib/buffer-reader":10}],10:[function(require,module,exports){var vint=require('./vint')
function BufferReader(buffer){this.buffer=buffer
this.offset=0}
BufferReader.prototype.nextInt16BE=function(){var value=this.buffer.readInt16BE(this.offset)
this.offset+=2
return value}
BufferReader.prototype.nextUInt8=function(){var value=this.buffer.readUInt8(this.offset)
this.offset+=1
return value}
BufferReader.prototype.nextUIntV=function(){var v=vint(this.buffer,this.offset)
this.offset+=v.length
return v.value}
BufferReader.prototype.nextIntV=function(){var v=vint(this.buffer,this.offset,true)
this.offset+=v.length
return v.value}
BufferReader.prototype.nextBuffer=function(length){var buffer=length?this.buffer.slice(this.offset,this.offset+length):this.buffer.slice(this.offset)
this.offset+=length||this.length
return buffer}
Object.defineProperty(BufferReader.prototype,'length',{get:function(){return this.buffer.length-this.offset}})
module.exports=BufferReader},{"./vint":11}],11:[function(require,module,exports){module.exports=function(buffer,start,signed){start=start||0
for(var length=1;length<=8;length++){if(buffer[start]>=Math.pow(2,8-length)){break}}
if(length>8){throw new Error('Unrepresentable length: '+length+' '+
buffer.toString('hex',start,start+length))}
if(start+length>buffer.length){return null}
var i
var value=buffer[start]&(1<<(8-length))-1
for(i=1;i<length;i++){if(i===7){if(value>=Math.pow(2,53-8)&&buffer[start+7]>0){return{length:length,value:-1}}}
value*=Math.pow(2,8)
value+=buffer[start+i]}
if(signed){value-=Math.pow(2,length*7-1)-1}
return{length:length,value:value}}},{}],12:[function(require,module,exports){(function(Buffer){var tools={readVint:function(buffer,start){start=start||0;for(var length=1;length<=8;length++){if(buffer[start]>=Math.pow(2,8-length)){break;}}
if(length>8){throw new Error("Unrepresentable length: "+length+" "+
buffer.toString('hex',start,start+length));}
if(start+length>buffer.length){return null;}
var value=buffer[start]&(1<<(8-length))-1;for(var i=1;i<length;i++){if(i===7){if(value>=Math.pow(2,53-8)&&buffer[start+7]>0){return{length:length,value:-1};}}
value*=Math.pow(2,8);value+=buffer[start+i];}
return{length:length,value:value};},writeVint:function(value){if(value<0||value>Math.pow(2,53)){throw new Error("Unrepresentable value: "+value);}
for(var length=1;length<=8;length++){if(value<Math.pow(2,7*length)-1){break;}}
var buffer=new Buffer(length);for(var i=1;i<=length;i++){var b=value&0xFF;buffer[length-i]=b;value-=b;value/=Math.pow(2,8);}
buffer[0]=buffer[0]|(1<<(8-length));return buffer;}};module.exports=tools;}).call(this,require("buffer").Buffer)},{"buffer":7}],13:[function(require,module,exports){function EventEmitter(){this._events=this._events||{};this._maxListeners=this._maxListeners||undefined;}
module.exports=EventEmitter;EventEmitter.EventEmitter=EventEmitter;EventEmitter.prototype._events=undefined;EventEmitter.prototype._maxListeners=undefined;EventEmitter.defaultMaxListeners=10;EventEmitter.prototype.setMaxListeners=function(n){if(!isNumber(n)||n<0||isNaN(n))
throw TypeError('n must be a positive number');this._maxListeners=n;return this;};EventEmitter.prototype.emit=function(type){var er,handler,len,args,i,listeners;if(!this._events)
this._events={};if(type==='error'){if(!this._events.error||(isObject(this._events.error)&&!this._events.error.length)){er=arguments[1];if(er instanceof Error){throw er;}else{var err=new Error('Uncaught, unspecified "error" event. ('+er+')');err.context=er;throw err;}}}
handler=this._events[type];if(isUndefined(handler))
return false;if(isFunction(handler)){switch(arguments.length){case 1:handler.call(this);break;case 2:handler.call(this,arguments[1]);break;case 3:handler.call(this,arguments[1],arguments[2]);break;default:args=Array.prototype.slice.call(arguments,1);handler.apply(this,args);}}else if(isObject(handler)){args=Array.prototype.slice.call(arguments,1);listeners=handler.slice();len=listeners.length;for(i=0;i<len;i++)
listeners[i].apply(this,args);}
return true;};EventEmitter.prototype.addListener=function(type,listener){var m;if(!isFunction(listener))
throw TypeError('listener must be a function');if(!this._events)
this._events={};if(this._events.newListener)
this.emit('newListener',type,isFunction(listener.listener)?listener.listener:listener);if(!this._events[type])
this._events[type]=listener;else if(isObject(this._events[type]))
this._events[type].push(listener);else
this._events[type]=[this._events[type],listener];if(isObject(this._events[type])&&!this._events[type].warned){if(!isUndefined(this._maxListeners)){m=this._maxListeners;}else{m=EventEmitter.defaultMaxListeners;}
if(m&&m>0&&this._events[type].length>m){this._events[type].warned=true;console.error('(node) warning: possible EventEmitter memory '+
'leak detected. %d listeners added. '+
'Use emitter.setMaxListeners() to increase limit.',this._events[type].length);if(typeof console.trace==='function'){console.trace();}}}
return this;};EventEmitter.prototype.on=EventEmitter.prototype.addListener;EventEmitter.prototype.once=function(type,listener){if(!isFunction(listener))
throw TypeError('listener must be a function');var fired=false;function g(){this.removeListener(type,g);if(!fired){fired=true;listener.apply(this,arguments);}}
g.listener=listener;this.on(type,g);return this;};EventEmitter.prototype.removeListener=function(type,listener){var list,position,length,i;if(!isFunction(listener))
throw TypeError('listener must be a function');if(!this._events||!this._events[type])
return this;list=this._events[type];length=list.length;position=-1;if(list===listener||(isFunction(list.listener)&&list.listener===listener)){delete this._events[type];if(this._events.removeListener)
this.emit('removeListener',type,listener);}else if(isObject(list)){for(i=length;i-->0;){if(list[i]===listener||(list[i].listener&&list[i].listener===listener)){position=i;break;}}
if(position<0)
return this;if(list.length===1){list.length=0;delete this._events[type];}else{list.splice(position,1);}
if(this._events.removeListener)
this.emit('removeListener',type,listener);}
return this;};EventEmitter.prototype.removeAllListeners=function(type){var key,listeners;if(!this._events)
return this;if(!this._events.removeListener){if(arguments.length===0)
this._events={};else if(this._events[type])
delete this._events[type];return this;}
if(arguments.length===0){for(key in this._events){if(key==='removeListener')continue;this.removeAllListeners(key);}
this.removeAllListeners('removeListener');this._events={};return this;}
listeners=this._events[type];if(isFunction(listeners)){this.removeListener(type,listeners);}else if(listeners){while(listeners.length)
this.removeListener(type,listeners[listeners.length-1]);}
delete this._events[type];return this;};EventEmitter.prototype.listeners=function(type){var ret;if(!this._events||!this._events[type])
ret=[];else if(isFunction(this._events[type]))
ret=[this._events[type]];else
ret=this._events[type].slice();return ret;};EventEmitter.prototype.listenerCount=function(type){if(this._events){var evlistener=this._events[type];if(isFunction(evlistener))
return 1;else if(evlistener)
return evlistener.length;}
return 0;};EventEmitter.listenerCount=function(emitter,type){return emitter.listenerCount(type);};function isFunction(arg){return typeof arg==='function';}
function isNumber(arg){return typeof arg==='number';}
function isObject(arg){return typeof arg==='object'&&arg!==null;}
function isUndefined(arg){return arg===void 0;}},{}],14:[function(require,module,exports){exports.read=function(buffer,offset,isLE,mLen,nBytes){var e,m
var eLen=(nBytes*8)-mLen-1
var eMax=(1<<eLen)-1
var eBias=eMax>>1
var nBits=-7
var i=isLE?(nBytes-1):0
var d=isLE?-1:1
var s=buffer[offset+i]
i+=d
e=s&((1<<(-nBits))-1)
s>>=(-nBits)
nBits+=eLen
for(;nBits>0;e=(e*256)+buffer[offset+i],i+=d,nBits-=8){}
m=e&((1<<(-nBits))-1)
e>>=(-nBits)
nBits+=mLen
for(;nBits>0;m=(m*256)+buffer[offset+i],i+=d,nBits-=8){}
if(e===0){e=1-eBias}else if(e===eMax){return m?NaN:((s?-1:1)*Infinity)}else{m=m+Math.pow(2,mLen)
e=e-eBias}
return(s?-1:1)*m*Math.pow(2,e-mLen)}
exports.write=function(buffer,value,offset,isLE,mLen,nBytes){var e,m,c
var eLen=(nBytes*8)-mLen-1
var eMax=(1<<eLen)-1
var eBias=eMax>>1
var rt=(mLen===23?Math.pow(2,-24)-Math.pow(2,-77):0)
var i=isLE?0:(nBytes-1)
var d=isLE?1:-1
var s=value<0||(value===0&&1/value<0)?1:0
value=Math.abs(value)
if(isNaN(value)||value===Infinity){m=isNaN(value)?1:0
e=eMax}else{e=Math.floor(Math.log(value)/Math.LN2)
if(value*(c=Math.pow(2,-e))<1){e--
c*=2}
if(e+eBias>=1){value+=rt/c}else{value+=rt*Math.pow(2,1-eBias)}
if(value*c>=2){e++
c/=2}
if(e+eBias>=eMax){m=0
e=eMax}else if(e+eBias>=1){m=((value*c)-1)*Math.pow(2,mLen)
e=e+eBias}else{m=value*Math.pow(2,eBias-1)*Math.pow(2,mLen)
e=0}}
for(;mLen>=8;buffer[offset+i]=m&0xff,i+=d,m/=256,mLen-=8){}
e=(e<<mLen)|m
eLen+=mLen
for(;eLen>0;buffer[offset+i]=e&0xff,i+=d,e/=256,eLen-=8){}
buffer[offset+i-d]|=s*128}},{}],15:[function(require,module,exports){(function(Buffer){var Uint64BE,Int64BE,Uint64LE,Int64LE;!function(exports){var UNDEFINED="undefined";var BUFFER=(UNDEFINED!==typeof Buffer)&&Buffer;var UINT8ARRAY=(UNDEFINED!==typeof Uint8Array)&&Uint8Array;var ARRAYBUFFER=(UNDEFINED!==typeof ArrayBuffer)&&ArrayBuffer;var ZERO=[0,0,0,0,0,0,0,0];var isArray=Array.isArray||_isArray;var BIT32=4294967296;var BIT24=16777216;var storage;Uint64BE=factory("Uint64BE",true,true);Int64BE=factory("Int64BE",true,false);Uint64LE=factory("Uint64LE",false,true);Int64LE=factory("Int64LE",false,false);function factory(name,bigendian,unsigned){var posH=bigendian?0:4;var posL=bigendian?4:0;var pos0=bigendian?0:3;var pos1=bigendian?1:2;var pos2=bigendian?2:1;var pos3=bigendian?3:0;var fromPositive=bigendian?fromPositiveBE:fromPositiveLE;var fromNegative=bigendian?fromNegativeBE:fromNegativeLE;var proto=Int64.prototype;var isName="is"+name;var _isInt64="_"+isName;proto.buffer=void 0;proto.offset=0;proto[_isInt64]=true;proto.toNumber=toNumber;proto.toString=toString;proto.toJSON=toNumber;proto.toArray=toArray;if(BUFFER)proto.toBuffer=toBuffer;if(UINT8ARRAY)proto.toArrayBuffer=toArrayBuffer;Int64[isName]=isInt64;exports[name]=Int64;return Int64;function Int64(buffer,offset,value,raddix){if(!(this instanceof Int64))return new Int64(buffer,offset,value,raddix);return init(this,buffer,offset,value,raddix);}
function isInt64(b){return!!(b&&b[_isInt64]);}
function init(that,buffer,offset,value,raddix){if(UINT8ARRAY&&ARRAYBUFFER){if(buffer instanceof ARRAYBUFFER)buffer=new UINT8ARRAY(buffer);if(value instanceof ARRAYBUFFER)value=new UINT8ARRAY(value);}
if(!buffer&&!offset&&!value&&!storage){that.buffer=newArray(ZERO,0);return;}
if(!isValidBuffer(buffer,offset)){var _storage=storage||Array;raddix=offset;value=buffer;offset=0;buffer=new _storage(8);}
that.buffer=buffer;that.offset=offset|=0;if(UNDEFINED===typeof value)return;if("string"===typeof value){fromString(buffer,offset,value,raddix||10);}else if(isValidBuffer(value,raddix)){fromArray(buffer,offset,value,raddix);}else if("number"===typeof raddix){writeInt32(buffer,offset+posH,value);writeInt32(buffer,offset+posL,raddix);}else if(value>0){fromPositive(buffer,offset,value);}else if(value<0){fromNegative(buffer,offset,value);}else{fromArray(buffer,offset,ZERO,0);}}
function fromString(buffer,offset,str,raddix){var pos=0;var len=str.length;var high=0;var low=0;if(str[0]==="-")pos++;var sign=pos;while(pos<len){var chr=parseInt(str[pos++],raddix);if(!(chr>=0))break;low=low*raddix+chr;high=high*raddix+Math.floor(low/BIT32);low%=BIT32;}
if(sign){high=~high;if(low){low=BIT32-low;}else{high++;}}
writeInt32(buffer,offset+posH,high);writeInt32(buffer,offset+posL,low);}
function toNumber(){var buffer=this.buffer;var offset=this.offset;var high=readInt32(buffer,offset+posH);var low=readInt32(buffer,offset+posL);if(!unsigned)high|=0;return high?(high*BIT32+low):low;}
function toString(radix){var buffer=this.buffer;var offset=this.offset;var high=readInt32(buffer,offset+posH);var low=readInt32(buffer,offset+posL);var str="";var sign=!unsigned&&(high&0x80000000);if(sign){high=~high;low=BIT32-low;}
radix=radix||10;while(1){var mod=(high%radix)*BIT32+low;high=Math.floor(high/radix);low=Math.floor(mod/radix);str=(mod%radix).toString(radix)+str;if(!high&&!low)break;}
if(sign){str="-"+str;}
return str;}
function writeInt32(buffer,offset,value){buffer[offset+pos3]=value&255;value=value>>8;buffer[offset+pos2]=value&255;value=value>>8;buffer[offset+pos1]=value&255;value=value>>8;buffer[offset+pos0]=value&255;}
function readInt32(buffer,offset){return(buffer[offset+pos0]*BIT24)+
(buffer[offset+pos1]<<16)+
(buffer[offset+pos2]<<8)+
buffer[offset+pos3];}}
function toArray(raw){var buffer=this.buffer;var offset=this.offset;storage=null;if(raw!==false&&offset===0&&buffer.length===8&&isArray(buffer))return buffer;return newArray(buffer,offset);}
function toBuffer(raw){var buffer=this.buffer;var offset=this.offset;storage=BUFFER;if(raw!==false&&offset===0&&buffer.length===8&&Buffer.isBuffer(buffer))return buffer;var dest=new BUFFER(8);fromArray(dest,0,buffer,offset);return dest;}
function toArrayBuffer(raw){var buffer=this.buffer;var offset=this.offset;var arrbuf=buffer.buffer;storage=UINT8ARRAY;if(raw!==false&&offset===0&&(arrbuf instanceof ARRAYBUFFER)&&arrbuf.byteLength===8)return arrbuf;var dest=new UINT8ARRAY(8);fromArray(dest,0,buffer,offset);return dest.buffer;}
function isValidBuffer(buffer,offset){var len=buffer&&buffer.length;offset|=0;return len&&(offset+8<=len)&&("string"!==typeof buffer[offset]);}
function fromArray(destbuf,destoff,srcbuf,srcoff){destoff|=0;srcoff|=0;for(var i=0;i<8;i++){destbuf[destoff++]=srcbuf[srcoff++]&255;}}
function newArray(buffer,offset){return Array.prototype.slice.call(buffer,offset,offset+8);}
function fromPositiveBE(buffer,offset,value){var pos=offset+8;while(pos>offset){buffer[--pos]=value&255;value/=256;}}
function fromNegativeBE(buffer,offset,value){var pos=offset+8;value++;while(pos>offset){buffer[--pos]=((-value)&255)^255;value/=256;}}
function fromPositiveLE(buffer,offset,value){var end=offset+8;while(offset<end){buffer[offset++]=value&255;value/=256;}}
function fromNegativeLE(buffer,offset,value){var end=offset+8;value++;while(offset<end){buffer[offset++]=((-value)&255)^255;value/=256;}}
function _isArray(val){return!!val&&"[object Array]"==Object.prototype.toString.call(val);}}(typeof exports==='object'&&typeof exports.nodeName!=='string'?exports:(this||{}));}).call(this,require("buffer").Buffer)},{"buffer":7}],16:[function(require,module,exports){var toString={}.toString;module.exports=Array.isArray||function(arr){return toString.call(arr)=='[object Array]';};},{}],17:[function(require,module,exports){'use strict';var byEbmlID={0x80:{name:"ChapterDisplay",level:4,type:"m",multiple:true,minver:1,webm:true,description:"Contains all possible strings to use for the chapter display."},0x83:{name:"TrackType",level:3,type:"u",mandatory:true,minver:1,range:"1-254",description:"A set of track types coded on 8 bits (1: video, 2: audio, 3: complex, 0x10: logo, 0x11: subtitle, 0x12: buttons, 0x20: control)."},0x85:{name:"ChapString",cppname:"ChapterString",level:5,type:"8",mandatory:true,minver:1,webm:true,description:"Contains the string to use as the chapter atom."},0x86:{name:"CodecID",level:3,type:"s",mandatory:true,minver:1,description:"An ID corresponding to the codec, see the codec page for more info."},0x88:{name:"FlagDefault",cppname:"TrackFlagDefault",level:3,type:"u",mandatory:true,minver:1,"default":1,range:"0-1",description:"Set if that track (audio, video or subs) SHOULD be active if no language found matches the user preference. (1 bit)"},0x89:{name:"ChapterTrackNumber",level:5,type:"u",mandatory:true,multiple:true,minver:1,webm:false,range:"not 0",description:"UID of the Track to apply this chapter too. In the absense of a control track, choosing this chapter will select the listed Tracks and deselect unlisted tracks. Absense of this element indicates that the Chapter should be applied to any currently used Tracks."},0x91:{name:"ChapterTimeStart",level:4,type:"u",mandatory:true,minver:1,webm:true,description:"Timestamp of the start of Chapter (not scaled)."},0x92:{name:"ChapterTimeEnd",level:4,type:"u",minver:1,webm:false,description:"Timestamp of the end of Chapter (timestamp excluded, not scaled)."},0x96:{name:"CueRefTime",level:5,type:"u",mandatory:true,minver:2,webm:false,description:"Timestamp of the referenced Block."},0x97:{name:"CueRefCluster",level:5,type:"u",mandatory:true,webm:false,description:"The Position of the Cluster containing the referenced Block."},0x98:{name:"ChapterFlagHidden",level:4,type:"u",mandatory:true,minver:1,webm:false,"default":0,range:"0-1",description:"If a chapter is hidden (1), it should not be available to the user interface (but still to Control Tracks; see flag notes). (1 bit)"},0x4254:{name:"ContentCompAlgo",level:6,type:"u",mandatory:true,minver:1,webm:false,"default":0,description:"The compression algorithm used. Algorithms that have been specified so far are: 0 - zlib,   3 - Header Stripping"},0x4255:{name:"ContentCompSettings",level:6,type:"b",minver:1,webm:false,description:"Settings that might be needed by the decompressor. For Header Stripping (ContentCompAlgo=3), the bytes that were removed from the beggining of each frames of the track."},0x4282:{name:"DocType",level:1,type:"s",mandatory:true,"default":"matroska",minver:1,description:"A string that describes the type of document that follows this EBML header. 'matroska' in our case or 'webm' for webm files."},0x4285:{name:"DocTypeReadVersion",level:1,type:"u",mandatory:true,"default":1,minver:1,description:"The minimum DocType version an interpreter has to support to read this file."},0x4286:{name:"EBMLVersion",level:1,type:"u",mandatory:true,"default":1,minver:1,description:"The version of EBML parser used to create the file."},0x4287:{name:"DocTypeVersion",level:1,type:"u",mandatory:true,"default":1,minver:1,description:"The version of DocType interpreter used to create the file."},0x4444:{name:"SegmentFamily",level:2,type:"b",multiple:true,minver:1,webm:false,bytesize:16,description:"A randomly generated unique ID that all segments related to each other must use (128 bits)."},0x4461:{name:"DateUTC",level:2,type:"d",minver:1,description:"Date of the origin of timestamp (value 0), i.e. production date."},0x4484:{name:"TagDefault",level:4,type:"u",mandatory:true,minver:1,webm:false,"default":1,range:"0-1",description:"Indication to know if this is the default/original language to use for the given tag. (1 bit)"},0x4485:{name:"TagBinary",level:4,type:"b",minver:1,webm:false,description:"The values of the Tag if it is binary. Note that this cannot be used in the same SimpleTag as TagString."},0x4487:{name:"TagString",level:4,type:"8",minver:1,webm:false,description:"The value of the Element."},0x4489:{name:"Duration",level:2,type:"f",minver:1,range:"> 0",description:"Duration of the segment (based on TimecodeScale)."},0x4598:{name:"ChapterFlagEnabled",level:4,type:"u",mandatory:true,minver:1,webm:false,"default":1,range:"0-1",description:"Specify wether the chapter is enabled. It can be enabled/disabled by a Control Track. When disabled, the movie should skip all the content between the TimeStart and TimeEnd of this chapter (see flag notes). (1 bit)"},0x4660:{name:"FileMimeType",level:3,type:"s",mandatory:true,minver:1,webm:false,description:"MIME type of the file."},0x4661:{name:"FileUsedStartTime",level:3,type:"u",divx:true,description:"DivX font extension"},0x4662:{name:"FileUsedEndTime",level:3,type:"u",divx:true,description:"DivX font extension"},0x4675:{name:"FileReferral",level:3,type:"b",webm:false,description:"A binary value that a track/codec can refer to when the attachment is needed."},0x5031:{name:"ContentEncodingOrder",level:5,type:"u",mandatory:true,minver:1,webm:false,"default":0,description:"Tells when this modification was used during encoding/muxing starting with 0 and counting upwards. The decoder/demuxer has to start with the highest order number it finds and work its way down. This value has to be unique over all ContentEncodingOrder elements in the segment."},0x5032:{name:"ContentEncodingScope",level:5,type:"u",mandatory:true,minver:1,webm:false,"default":1,range:"not 0",description:"A bit field that describes which elements have been modified in this way. Values (big endian) can be OR'ed. Possible values: 1 - all frame contents, 2 - the track's private data, 4 - the next ContentEncoding (next ContentEncodingOrder. Either the data inside ContentCompression and/or ContentEncryption)"},0x5033:{name:"ContentEncodingType",level:5,type:"u",mandatory:true,minver:1,webm:false,"default":0,description:"A value describing what kind of transformation has been done. Possible values: 0 - compression, 1 - encryption"},0x5034:{name:"ContentCompression",level:5,type:"m",minver:1,webm:false,description:"Settings describing the compression used. Must be present if the value of ContentEncodingType is 0 and absent otherwise. Each block must be decompressable even if no previous block is available in order not to prevent seeking."},0x5035:{name:"ContentEncryption",level:5,type:"m",minver:1,webm:false,description:"Settings describing the encryption used. Must be present if the value of ContentEncodingType is 1 and absent otherwise."},0x5378:{name:"CueBlockNumber",level:4,type:"u",minver:1,"default":1,range:"not 0",description:"Number of the Block in the specified Cluster."},0x5654:{name:"ChapterStringUID",level:4,type:"8",mandatory:false,minver:3,webm:true,description:"A unique string ID to identify the Chapter. Use for WebVTT cue identifier storage."},0x5741:{name:"WritingApp",level:2,type:"8",mandatory:true,minver:1,description:"Writing application (\"mkvmerge-0.3.3\")."},0x5854:{name:"SilentTracks",cppname:"ClusterSilentTracks",level:2,type:"m",minver:1,webm:false,description:"The list of tracks that are not used in that part of the stream. It is useful when using overlay tracks on seeking. Then you should decide what track to use."},0x6240:{name:"ContentEncoding",level:4,type:"m",mandatory:true,multiple:true,minver:1,webm:false,description:"Settings for one content encoding like compression or encryption."},0x6264:{name:"BitDepth",cppname:"AudioBitDepth",level:4,type:"u",minver:1,range:"not 0",description:"Bits per sample, mostly used for PCM."},0x6532:{name:"SignedElement",level:3,type:"b",multiple:true,webm:false,description:"An element ID whose data will be used to compute the signature."},0x6624:{name:"TrackTranslate",level:3,type:"m",multiple:true,minver:1,webm:false,description:"The track identification for the given Chapter Codec."},0x6911:{name:"ChapProcessCommand",cppname:"ChapterProcessCommand",level:5,type:"m",multiple:true,minver:1,webm:false,description:"Contains all the commands associated to the Atom."},0x6922:{name:"ChapProcessTime",cppname:"ChapterProcessTime",level:6,type:"u",mandatory:true,minver:1,webm:false,description:"Defines when the process command should be handled (0: during the whole chapter, 1: before starting playback, 2: after playback of the chapter)."},0x6924:{name:"ChapterTranslate",level:2,type:"m",multiple:true,minver:1,webm:false,description:"A tuple of corresponding ID used by chapter codecs to represent this segment."},0x6933:{name:"ChapProcessData",cppname:"ChapterProcessData",level:6,type:"b",mandatory:true,minver:1,webm:false,description:"Contains the command information. The data should be interpreted depending on the ChapProcessCodecID value. For ChapProcessCodecID = 1, the data correspond to the binary DVD cell pre/post commands."},0x6944:{name:"ChapProcess",cppname:"ChapterProcess",level:4,type:"m",multiple:true,minver:1,webm:false,description:"Contains all the commands associated to the Atom."},0x6955:{name:"ChapProcessCodecID",cppname:"ChapterProcessCodecID",level:5,type:"u",mandatory:true,minver:1,webm:false,"default":0,description:"Contains the type of the codec used for the processing. A value of 0 means native Matroska processing (to be defined), a value of 1 means the DVD command set is used. More codec IDs can be added later."},0x7373:{name:"Tag",level:2,type:"m",mandatory:true,multiple:true,minver:1,webm:false,description:"Element containing elements specific to Tracks/Chapters."},0x7384:{name:"SegmentFilename",level:2,type:"8",minver:1,webm:false,description:"A filename corresponding to this segment."},0x7446:{name:"AttachmentLink",cppname:"TrackAttachmentLink",level:3,type:"u",minver:1,webm:false,range:"not 0",description:"The UID of an attachment that is used by this codec."},0x258688:{name:"CodecName",level:3,type:"8",minver:1,description:"A human-readable string specifying the codec."},0x18538067:{name:"Segment",level:"0",type:"m",mandatory:true,multiple:true,minver:1,description:"This element contains all other top-level (level 1) elements. Typically a Matroska file is composed of 1 segment."},0x447a:{name:"TagLanguage",level:4,type:"s",mandatory:true,minver:1,webm:false,"default":"und",description:"Specifies the language of the tag specified, in the Matroska languages form."},0x45a3:{name:"TagName",level:4,type:"8",mandatory:true,minver:1,webm:false,description:"The name of the Tag that is going to be stored."},0x67c8:{name:"SimpleTag",cppname:"TagSimple",level:3,"recursive":"1",type:"m",mandatory:true,multiple:true,minver:1,webm:false,description:"Contains general information about the target."},0x63c6:{name:"TagAttachmentUID",level:4,type:"u",multiple:true,minver:1,webm:false,"default":0,description:"A unique ID to identify the Attachment(s) the tags belong to. If the value is 0 at this level, the tags apply to all the attachments in the Segment."},0x63c4:{name:"TagChapterUID",level:4,type:"u",multiple:true,minver:1,webm:false,"default":0,description:"A unique ID to identify the Chapter(s) the tags belong to. If the value is 0 at this level, the tags apply to all chapters in the Segment."},0x63c9:{name:"TagEditionUID",level:4,type:"u",multiple:true,minver:1,webm:false,"default":0,description:"A unique ID to identify the EditionEntry(s) the tags belong to. If the value is 0 at this level, the tags apply to all editions in the Segment."},0x63c5:{name:"TagTrackUID",level:4,type:"u",multiple:true,minver:1,webm:false,"default":0,description:"A unique ID to identify the Track(s) the tags belong to. If the value is 0 at this level, the tags apply to all tracks in the Segment."},0x63ca:{name:"TargetType",cppname:"TagTargetType",level:4,type:"s",minver:1,webm:false,"strong":"informational",description:"An  string that can be used to display the logical level of the target like \"ALBUM\", \"TRACK\", \"MOVIE\", \"CHAPTER\", etc (see TargetType)."},0x68ca:{name:"TargetTypeValue",cppname:"TagTargetTypeValue",level:4,type:"u",minver:1,webm:false,"default":50,description:"A number to indicate the logical level of the target (see TargetType)."},0x63c0:{name:"Targets",cppname:"TagTargets",level:3,type:"m",mandatory:true,minver:1,webm:false,description:"Contain all UIDs where the specified meta data apply. It is empty to describe everything in the segment."},0x1254c367:{name:"Tags",level:1,type:"m",multiple:true,minver:1,webm:false,description:"Element containing elements specific to Tracks/Chapters. A list of valid tags can be found here."},0x450d:{name:"ChapProcessPrivate",cppname:"ChapterProcessPrivate",level:5,type:"b",minver:1,webm:false,description:"Some optional data attached to the ChapProcessCodecID information. For ChapProcessCodecID = 1, it is the \"DVD level\" equivalent."},0x437e:{name:"ChapCountry",cppname:"ChapterCountry",level:5,type:"s",multiple:true,minver:1,webm:false,description:"The countries corresponding to the string, same 2 octets as in Internet domains."},0x437c:{name:"ChapLanguage",cppname:"ChapterLanguage",level:5,type:"s",mandatory:true,multiple:true,minver:1,webm:true,"default":"eng",description:"The languages corresponding to the string, in the bibliographic ISO-639-2 form."},0x8f:{name:"ChapterTrack",level:4,type:"m",minver:1,webm:false,description:"List of tracks on which the chapter applies. If this element is not present, all tracks apply"},0x63c3:{name:"ChapterPhysicalEquiv",level:4,type:"u",minver:1,webm:false,description:"Specify the physical equivalent of this ChapterAtom like \"DVD\" (60) or \"SIDE\" (50), see complete list of values."},0x6ebc:{name:"ChapterSegmentEditionUID",level:4,type:"u",minver:1,webm:false,range:"not 0",description:"The EditionUID to play from the segment linked in ChapterSegmentUID."},0x6e67:{name:"ChapterSegmentUID",level:4,type:"b",minver:1,webm:false,range:">0",bytesize:16,description:"A segment to play in place of this chapter. Edition ChapterSegmentEditionUID should be used for this segment, otherwise no edition is used."},0x73c4:{name:"ChapterUID",level:4,type:"u",mandatory:true,minver:1,webm:true,range:"not 0",description:"A unique ID to identify the Chapter."},0xb6:{name:"ChapterAtom",level:3,"recursive":"1",type:"m",mandatory:true,multiple:true,minver:1,webm:true,description:"Contains the atom information to use as the chapter atom (apply to all tracks)."},0x45dd:{name:"EditionFlagOrdered",level:3,type:"u",minver:1,webm:false,"default":0,range:"0-1",description:"Specify if the chapters can be defined multiple times and the order to play them is enforced. (1 bit)"},0x45db:{name:"EditionFlagDefault",level:3,type:"u",mandatory:true,minver:1,webm:false,"default":0,range:"0-1",description:"If a flag is set (1) the edition should be used as the default one. (1 bit)"},0x45bd:{name:"EditionFlagHidden",level:3,type:"u",mandatory:true,minver:1,webm:false,"default":0,range:"0-1",description:"If an edition is hidden (1), it should not be available to the user interface (but still to Control Tracks; see flag notes). (1 bit)"},0x45bc:{name:"EditionUID",level:3,type:"u",minver:1,webm:false,range:"not 0",description:"A unique ID to identify the edition. It's useful for tagging an edition."},0x45b9:{name:"EditionEntry",level:2,type:"m",mandatory:true,multiple:true,minver:1,webm:true,description:"Contains all information about a segment edition."},0x1043a770:{name:"Chapters",level:1,type:"m",minver:1,webm:true,description:"A system to define basic menus and partition data. For more detailed information, look at the Chapters Explanation."},0x46ae:{name:"FileUID",level:3,type:"u",mandatory:true,minver:1,webm:false,range:"not 0",description:"Unique ID representing the file, as random as possible."},0x465c:{name:"FileData",level:3,type:"b",mandatory:true,minver:1,webm:false,description:"The data of the file."},0x466e:{name:"FileName",level:3,type:"8",mandatory:true,minver:1,webm:false,description:"Filename of the attached file."},0x467e:{name:"FileDescription",level:3,type:"8",minver:1,webm:false,description:"A human-friendly name for the attached file."},0x61a7:{name:"AttachedFile",level:2,type:"m",mandatory:true,multiple:true,minver:1,webm:false,description:"An attached file."},0x1941a469:{name:"Attachments",level:1,type:"m",minver:1,webm:false,description:"Contain attached files."},0xeb:{name:"CueRefCodecState",level:5,type:"u",webm:false,"default":0,description:"The position of the Codec State corresponding to this referenced element. 0 means that the data is taken from the initial Track Entry."},0x535f:{name:"CueRefNumber",level:5,type:"u",webm:false,"default":1,range:"not 0",description:"Number of the referenced Block of Track X in the specified Cluster."},0xdb:{name:"CueReference",level:4,type:"m",multiple:true,minver:2,webm:false,description:"The Clusters containing the required referenced Blocks."},0xea:{name:"CueCodecState",level:4,type:"u",minver:2,webm:false,"default":0,description:"The position of the Codec State corresponding to this Cue element. 0 means that the data is taken from the initial Track Entry."},0xb2:{name:"CueDuration",level:4,type:"u",mandatory:false,minver:4,webm:false,description:"The duration of the block according to the segment time base. If missing the track's DefaultDuration does not apply and no duration information is available in terms of the cues."},0xf0:{name:"CueRelativePosition",level:4,type:"u",mandatory:false,minver:4,webm:false,description:"The relative position of the referenced block inside the cluster with 0 being the first possible position for an element inside that cluster.",position:"clusterRelative"},0xf1:{name:"CueClusterPosition",level:4,type:"u",mandatory:true,minver:1,description:"The position of the Cluster containing the required Block.",position:"segment",},0xf7:{name:"CueTrack",level:4,type:"u",mandatory:true,minver:1,range:"not 0",description:"The track for which a position is given."},0xb7:{name:"CueTrackPositions",level:3,type:"m",mandatory:true,multiple:true,minver:1,description:"Contain positions for different tracks corresponding to the timestamp."},0xb3:{name:"CueTime",level:3,type:"u",mandatory:true,minver:1,description:"Absolute timestamp according to the segment time base."},0xbb:{name:"CuePoint",level:2,type:"m",mandatory:true,multiple:true,minver:1,description:"Contains all information relative to a seek point in the segment."},0x1c53bb6b:{name:"Cues",level:1,type:"m",minver:1,description:"A top-level element to speed seeking access. All entries are local to the segment. Should be mandatory for non \"live\" streams."},0x47e6:{name:"ContentSigHashAlgo",level:6,type:"u",minver:1,webm:false,"default":0,description:"The hash algorithm used for the signature. A value of '0' means that the contents have not been signed but only encrypted. Predefined values: 1 - SHA1-160 2 - MD5"},0x47e5:{name:"ContentSigAlgo",level:6,type:"u",minver:1,webm:false,"default":0,description:"The algorithm used for the signature. A value of '0' means that the contents have not been signed but only encrypted. Predefined values: 1 - RSA"},0x47e4:{name:"ContentSigKeyID",level:6,type:"b",minver:1,webm:false,description:"This is the ID of the private key the data was signed with."},0x47e3:{name:"ContentSignature",level:6,type:"b",minver:1,webm:false,description:"A cryptographic signature of the contents."},0x47e2:{name:"ContentEncKeyID",level:6,type:"b",minver:1,webm:false,description:"For public key algorithms this is the ID of the public key the the data was encrypted with."},0x47e1:{name:"ContentEncAlgo",level:6,type:"u",minver:1,webm:false,"default":0,description:"The encryption algorithm used. The value '0' means that the contents have not been encrypted but only signed. Predefined values: 1 - DES, 2 - 3DES, 3 - Twofish, 4 - Blowfish, 5 - AES"},0x6d80:{name:"ContentEncodings",level:3,type:"m",minver:1,webm:false,description:"Settings for several content encoding mechanisms like compression or encryption."},0xc4:{name:"TrickMasterTrackSegmentUID",level:3,type:"b",divx:true,bytesize:16,description:"DivX trick track extenstions"},0xc7:{name:"TrickMasterTrackUID",level:3,type:"u",divx:true,description:"DivX trick track extenstions"},0xc6:{name:"TrickTrackFlag",level:3,type:"u",divx:true,"default":0,description:"DivX trick track extenstions"},0xc1:{name:"TrickTrackSegmentUID",level:3,type:"b",divx:true,bytesize:16,description:"DivX trick track extenstions"},0xc0:{name:"TrickTrackUID",level:3,type:"u",divx:true,description:"DivX trick track extenstions"},0xed:{name:"TrackJoinUID",level:5,type:"u",mandatory:true,multiple:true,minver:3,webm:false,range:"not 0",description:"The trackUID number of a track whose blocks are used to create this virtual track."},0xe9:{name:"TrackJoinBlocks",level:4,type:"m",minver:3,webm:false,description:"Contains the list of all tracks whose Blocks need to be combined to create this virtual track"},0xe6:{name:"TrackPlaneType",level:6,type:"u",mandatory:true,minver:3,webm:false,description:"The kind of plane this track corresponds to (0: left eye, 1: right eye, 2: background)."},0xe5:{name:"TrackPlaneUID",level:6,type:"u",mandatory:true,minver:3,webm:false,range:"not 0",description:"The trackUID number of the track representing the plane."},0xe4:{name:"TrackPlane",level:5,type:"m",mandatory:true,multiple:true,minver:3,webm:false,description:"Contains a video plane track that need to be combined to create this 3D track"},0xe3:{name:"TrackCombinePlanes",level:4,type:"m",minver:3,webm:false,description:"Contains the list of all video plane tracks that need to be combined to create this 3D track"},0xe2:{name:"TrackOperation",level:3,type:"m",minver:3,webm:false,description:"Operation that needs to be applied on tracks to create this virtual track. For more details look at the Specification Notes on the subject."},0x7d7b:{name:"ChannelPositions",cppname:"AudioPosition",level:4,type:"b",webm:false,description:"Table of horizontal angles for each successive channel, see appendix."},0x9f:{name:"Channels",cppname:"AudioChannels",level:4,type:"u",mandatory:true,minver:1,"default":1,range:"not 0",description:"Numbers of channels in the track."},0x78b5:{name:"OutputSamplingFrequency",cppname:"AudioOutputSamplingFreq",level:4,type:"f",minver:1,"default":"Sampling Frequency",range:"> 0",description:"Real output sampling frequency in Hz (used for SBR techniques)."},0xb5:{name:"SamplingFrequency",cppname:"AudioSamplingFreq",level:4,type:"f",mandatory:true,minver:1,"default":8000.0,range:"> 0",description:"Sampling frequency in Hz."},0xe1:{name:"Audio",cppname:"TrackAudio",level:3,type:"m",minver:1,description:"Audio settings."},0x2383e3:{name:"FrameRate",cppname:"VideoFrameRate",level:4,type:"f",range:"> 0","strong":"Informational",description:"Number of frames per second.  only."},0x2fb523:{name:"GammaValue",cppname:"VideoGamma",level:4,type:"f",webm:false,range:"> 0",description:"Gamma Value."},0x2eb524:{name:"ColourSpace",cppname:"VideoColourSpace",level:4,type:"b",minver:1,webm:false,bytesize:4,description:"Same value as in AVI (32 bits)."},0x54b3:{name:"AspectRatioType",cppname:"VideoAspectRatio",level:4,type:"u",minver:1,"default":0,description:"Specify the possible modifications to the aspect ratio (0: free resizing, 1: keep aspect ratio, 2: fixed)."},0x54b2:{name:"DisplayUnit",cppname:"VideoDisplayUnit",level:4,type:"u",minver:1,"default":0,description:"How DisplayWidth & DisplayHeight should be interpreted (0: pixels, 1: centimeters, 2: inches, 3: Display Aspect Ratio)."},0x54ba:{name:"DisplayHeight",cppname:"VideoDisplayHeight",level:4,type:"u",minver:1,"default":"PixelHeight",range:"not 0",description:"Height of the video frames to display. The default value is only valid when DisplayUnit is 0."},0x54b0:{name:"DisplayWidth",cppname:"VideoDisplayWidth",level:4,type:"u",minver:1,"default":"PixelWidth",range:"not 0",description:"Width of the video frames to display. The default value is only valid when DisplayUnit is 0."},0x54dd:{name:"PixelCropRight",cppname:"VideoPixelCropRight",level:4,type:"u",minver:1,"default":0,description:"The number of video pixels to remove on the right of the image."},0x54cc:{name:"PixelCropLeft",cppname:"VideoPixelCropLeft",level:4,type:"u",minver:1,"default":0,description:"The number of video pixels to remove on the left of the image."},0x54bb:{name:"PixelCropTop",cppname:"VideoPixelCropTop",level:4,type:"u",minver:1,"default":0,description:"The number of video pixels to remove at the top of the image."},0x54aa:{name:"PixelCropBottom",cppname:"VideoPixelCropBottom",level:4,type:"u",minver:1,"default":0,description:"The number of video pixels to remove at the bottom of the image (for HDTV content)."},0xba:{name:"PixelHeight",cppname:"VideoPixelHeight",level:4,type:"u",mandatory:true,minver:1,range:"not 0",description:"Height of the encoded video frames in pixels."},0xb0:{name:"PixelWidth",cppname:"VideoPixelWidth",level:4,type:"u",mandatory:true,minver:1,range:"not 0",description:"Width of the encoded video frames in pixels."},0x53b9:{name:"OldStereoMode",level:4,type:"u","maxver":"0",webm:false,divx:false,description:"DEPRECATED, DO NOT USE. Bogus StereoMode value used in old versions of libmatroska. (0: mono, 1: right eye, 2: left eye, 3: both eyes)."},0x53c0:{name:"AlphaMode",cppname:"VideoAlphaMode",level:4,type:"u",minver:3,webm:true,"default":0,description:"Alpha Video Mode. Presence of this element indicates that the BlockAdditional element could contain Alpha data."},0x53b8:{name:"StereoMode",cppname:"VideoStereoMode",level:4,type:"u",minver:3,webm:true,"default":0,description:"Stereo-3D video mode (0: mono, 1: side by side (left eye is first), 2: top-bottom (right eye is first), 3: top-bottom (left eye is first), 4: checkboard (right is first), 5: checkboard (left is first), 6: row interleaved (right is first), 7: row interleaved (left is first), 8: column interleaved (right is first), 9: column interleaved (left is first), 10: anaglyph (cyan/red), 11: side by side (right eye is first), 12: anaglyph (green/magenta), 13 both eyes laced in one Block (left eye is first), 14 both eyes laced in one Block (right eye is first)) . There are some more details on 3D support in the Specification Notes."},0x9a:{name:"FlagInterlaced",cppname:"VideoFlagInterlaced",level:4,type:"u",mandatory:true,minver:2,webm:true,"default":0,range:"0-1",description:"Set if the video is interlaced. (1 bit)"},0xe0:{name:"Video",cppname:"TrackVideo",level:3,type:"m",minver:1,description:"Video settings."},0x66a5:{name:"TrackTranslateTrackID",level:4,type:"b",mandatory:true,minver:1,webm:false,description:"The binary value used to represent this track in the chapter codec data. The format depends on the ChapProcessCodecID used."},0x66bf:{name:"TrackTranslateCodec",level:4,type:"u",mandatory:true,minver:1,webm:false,description:"The chapter codec using this ID (0: Matroska Script, 1: DVD-menu)."},0x66fc:{name:"TrackTranslateEditionUID",level:4,type:"u",multiple:true,minver:1,webm:false,description:"Specify an edition UID on which this translation applies. When not specified, it means for all editions found in the segment."},0x56bb:{name:"SeekPreRoll",level:3,type:"u",mandatory:true,multiple:false,"default":0,minver:4,webm:true,description:"After a discontinuity, SeekPreRoll is the duration in nanoseconds of the data the decoder must decode before the decoded data is valid."},0x56aa:{name:"CodecDelay",level:3,type:"u",multiple:false,"default":0,minver:4,webm:true,description:"CodecDelay is The codec-built-in delay in nanoseconds. This value must be subtracted from each block timestamp in order to get the actual timestamp. The value should be small so the muxing of tracks with the same actual timestamp are in the same Cluster."},0x6fab:{name:"TrackOverlay",level:3,type:"u",multiple:true,minver:1,webm:false,description:"Specify that this track is an overlay track for the Track specified (in the u-integer). That means when this track has a gap (see SilentTracks) the overlay track should be used instead. The order of multiple TrackOverlay matters, the first one is the one that should be used. If not found it should be the second, etc."},0xaa:{name:"CodecDecodeAll",level:3,type:"u",mandatory:true,minver:2,webm:false,"default":1,range:"0-1",description:"The codec can decode potentially damaged data (1 bit)."},0x26b240:{name:"CodecDownloadURL",level:3,type:"s",multiple:true,webm:false,description:"A URL to download about the codec used."},0x3b4040:{name:"CodecInfoURL",level:3,type:"s",multiple:true,webm:false,description:"A URL to find information about the codec used."},0x3a9697:{name:"CodecSettings",level:3,type:"8",webm:false,description:"A string describing the encoding setting used."},0x63a2:{name:"CodecPrivate",level:3,type:"b",minver:1,description:"Private data only known to the codec."},0x22b59c:{name:"Language",cppname:"TrackLanguage",level:3,type:"s",minver:1,"default":"eng",description:"Specifies the language of the track in the Matroska languages form."},0x536e:{name:"Name",cppname:"TrackName",level:3,type:"8",minver:1,description:"A human-readable track name."},0x55ee:{name:"MaxBlockAdditionID",level:3,type:"u",mandatory:true,minver:1,webm:false,"default":0,description:"The maximum value of BlockAdditions for this track."},0x537f:{name:"TrackOffset",level:3,type:"i",webm:false,"default":0,description:"A value to add to the Block's Timestamp. This can be used to adjust the playback offset of a track."},0x23314f:{name:"TrackTimecodeScale",level:3,type:"f",mandatory:true,minver:1,"maxver":"3",webm:false,"default":1.0,range:"> 0",description:"DEPRECATED, DO NOT USE. The scale to apply on this track to work at normal speed in relation with other tracks (mostly used to adjust video speed when the audio length differs)."},0x234e7a:{name:"DefaultDecodedFieldDuration",cppname:"TrackDefaultDecodedFieldDuration",level:3,type:"u",minver:4,range:"not 0",description:"The period in nanoseconds (not scaled by TimcodeScale)\nbetween two successive fields at the output of the decoding process (see the notes)"},0x23e383:{name:"DefaultDuration",cppname:"TrackDefaultDuration",level:3,type:"u",minver:1,range:"not 0",description:"Number of nanoseconds (not scaled via TimecodeScale) per frame ('frame' in the Matroska sense -- one element put into a (Simple)Block)."},0x6df8:{name:"MaxCache",cppname:"TrackMaxCache",level:3,type:"u",minver:1,webm:false,description:"The maximum cache size required to store referenced frames in and the current frame. 0 means no cache is needed."},0x6de7:{name:"MinCache",cppname:"TrackMinCache",level:3,type:"u",mandatory:true,minver:1,webm:false,"default":0,description:"The minimum number of frames a player should be able to cache during playback. If set to 0, the reference pseudo-cache system is not used."},0x9c:{name:"FlagLacing",cppname:"TrackFlagLacing",level:3,type:"u",mandatory:true,minver:1,"default":1,range:"0-1",description:"Set if the track may contain blocks using lacing. (1 bit)"},0x55aa:{name:"FlagForced",cppname:"TrackFlagForced",level:3,type:"u",mandatory:true,minver:1,"default":0,range:"0-1",description:"Set if that track MUST be active during playback. There can be many forced track for a kind (audio, video or subs), the player should select the one which language matches the user preference or the default + forced track. Overlay MAY happen between a forced and non-forced track of the same kind. (1 bit)"},0xb9:{name:"FlagEnabled",cppname:"TrackFlagEnabled",level:3,type:"u",mandatory:true,minver:2,webm:true,"default":1,range:"0-1",description:"Set if the track is usable. (1 bit)"},0x73c5:{name:"TrackUID",level:3,type:"u",mandatory:true,minver:1,range:"not 0",description:"A unique ID to identify the Track. This should be kept the same when making a direct stream copy of the Track to another file."},0xd7:{name:"TrackNumber",level:3,type:"u",mandatory:true,minver:1,range:"not 0",description:"The track number as used in the Block Header (using more than 127 tracks is not encouraged, though the design allows an unlimited number)."},0xae:{name:"TrackEntry",level:2,type:"m",mandatory:true,multiple:true,minver:1,description:"Describes a track with all elements."},0x1654ae6b:{name:"Tracks",level:1,type:"m",multiple:true,minver:1,description:"A top-level block of information with many tracks described."},0xaf:{name:"EncryptedBlock",level:2,type:"b",multiple:true,webm:false,description:"Similar to EncryptedBlock Structure)"},0xca:{name:"ReferenceTimeCode",level:4,type:"u",multiple:false,mandatory:true,minver:0,webm:false,divx:true,description:"DivX trick track extenstions"},0xc9:{name:"ReferenceOffset",level:4,type:"u",multiple:false,mandatory:true,minver:0,webm:false,divx:true,description:"DivX trick track extenstions"},0xc8:{name:"ReferenceFrame",level:3,type:"m",multiple:false,minver:0,webm:false,divx:true,description:"DivX trick track extenstions"},0xcf:{name:"SliceDuration",level:5,type:"u","default":0,description:"The (scaled) duration to apply to the element."},0xce:{name:"Delay",cppname:"SliceDelay",level:5,type:"u","default":0,description:"The (scaled) delay to apply to the element."},0xcb:{name:"BlockAdditionID",cppname:"SliceBlockAddID",level:5,type:"u","default":0,description:"The ID of the BlockAdditional element (0 is the main Block)."},0xcd:{name:"FrameNumber",cppname:"SliceFrameNumber",level:5,type:"u","default":0,description:"The number of the frame to generate from this lace with this delay (allow you to generate many frames from the same Block/Frame)."},0xcc:{name:"LaceNumber",cppname:"SliceLaceNumber",level:5,type:"u",minver:1,"default":0,divx:false,description:"The reverse number of the frame in the lace (0 is the last frame, 1 is the next to last, etc). While there are a few files in the wild with this element, it is no longer in use and has been deprecated. Being able to interpret this element is not required for playback."},0xe8:{name:"TimeSlice",level:4,type:"m",multiple:true,minver:1,divx:false,description:"Contains extra time information about the data contained in the Block. While there are a few files in the wild with this element, it is no longer in use and has been deprecated. Being able to interpret this element is not required for playback."},0x8e:{name:"Slices",level:3,type:"m",minver:1,divx:false,description:"Contains slices description."},0x75a2:{name:"DiscardPadding",level:3,type:"i",minver:4,webm:true,description:"Duration in nanoseconds of the silent data added to the Block (padding at the end of the Block for positive value, at the beginning of the Block for negative value). The duration of DiscardPadding is not calculated in the duration of the TrackEntry and should be discarded during playback."},0xa4:{name:"CodecState",level:3,type:"b",minver:2,webm:false,description:"The new codec state to use. Data interpretation is private to the codec. This information should always be referenced by a seek entry."},0xfd:{name:"ReferenceVirtual",level:3,type:"i",webm:false,description:"Relative position of the data that should be in position of the virtual block."},0xfb:{name:"ReferenceBlock",level:3,type:"i",multiple:true,minver:1,description:"Timestamp of another frame used as a reference (ie: B or P frame). The timestamp is relative to the block it's attached to."},0xfa:{name:"ReferencePriority",cppname:"FlagReferenced",level:3,type:"u",mandatory:true,minver:1,webm:false,"default":0,description:"This frame is referenced and has the specified cache priority. In cache only a frame of the same or higher priority can replace this frame. A value of 0 means the frame is not referenced."},0x9b:{name:"BlockDuration",level:3,type:"u",minver:1,"default":"TrackDuration",description:"The duration of the Block (based on TimecodeScale). This element is mandatory when DefaultDuration is set for the track (but can be omitted as other default values). When not written and with no DefaultDuration, the value is assumed to be the difference between the timestamp of this Block and the timestamp of the next Block in \"display\" order (not coding order). This element can be useful at the end of a Track (as there is not other Block available), or when there is a break in a track like for subtitle tracks. When set to 0 that means the frame is not a keyframe."},0xa5:{name:"BlockAdditional",level:5,type:"b",mandatory:true,minver:1,webm:false,description:"Interpreted by the codec as it wishes (using the BlockAddID)."},0xee:{name:"BlockAddID",level:5,type:"u",mandatory:true,minver:1,webm:false,"default":1,range:"not 0",description:"An ID to identify the BlockAdditional level."},0xa6:{name:"BlockMore",level:4,type:"m",mandatory:true,multiple:true,minver:1,webm:false,description:"Contain the BlockAdditional and some parameters."},0x75a1:{name:"BlockAdditions",level:3,type:"m",minver:1,webm:false,description:"Contain additional blocks to complete the main one. An EBML parser that has no knowledge of the Block structure could still see and use/skip these data."},0xa2:{name:"BlockVirtual",level:3,type:"b",webm:false,description:"A Block with no data. It must be stored in the stream at the place the real Block should be in display order. (see Block Virtual)"},0xa1:{name:"Block",level:3,type:"b",mandatory:true,minver:1,description:"Block containing the actual data to be rendered and a timestamp relative to the Cluster Timecode. (see Block Structure)"},0xa0:{name:"BlockGroup",level:2,type:"m",multiple:true,minver:1,description:"Basic container of information containing a single Block or BlockVirtual, and information specific to that Block/VirtualBlock."},0xa3:{name:"SimpleBlock",level:2,type:"b",multiple:true,minver:2,webm:true,divx:true,description:"Similar to SimpleBlock Structure"},0xab:{name:"PrevSize",cppname:"ClusterPrevSize",level:2,type:"u",minver:1,description:"Size of the previous Cluster, in octets. Can be useful for backward playing.",position:"prevCluster"},0xa7:{name:"Position",cppname:"ClusterPosition",level:2,type:"u",minver:1,webm:false,description:"The Position of the Cluster in the segment (0 in live broadcast streams). It might help to resynchronise offset on damaged streams.",position:"segment"},0x58d7:{name:"SilentTrackNumber",cppname:"ClusterSilentTrackNumber",level:3,type:"u",multiple:true,minver:1,webm:false,description:"One of the track number that are not used from now on in the stream. It could change later if not specified as silent in a further Cluster."},0xe7:{name:"Timecode",cppname:"ClusterTimecode",level:2,type:"u",mandatory:true,minver:1,description:"Absolute timestamp of the cluster (based on TimecodeScale)."},0x1f43b675:{name:"Cluster",level:1,type:"m",multiple:true,minver:1,description:"The lower level element containing the (monolithic) Block structure."},0x4d80:{name:"MuxingApp",level:2,type:"8",mandatory:true,minver:1,description:"Muxing application or library (\"libmatroska-0.4.3\")."},0x7ba9:{name:"Title",level:2,type:"8",minver:1,webm:false,description:"General name of the segment."},0x2ad7b2:{name:"TimecodeScaleDenominator",level:2,type:"u",mandatory:true,minver:4,"default":"1000000000",description:"Timestamp scale numerator, see TimecodeScale."},0x2ad7b1:{name:"TimecodeScale",level:2,type:"u",mandatory:true,minver:1,"default":"1000000",description:"Timestamp scale in nanoseconds (1.000.000 means all timestamps in the segment are expressed in milliseconds)."},0x69a5:{name:"ChapterTranslateID",level:3,type:"b",mandatory:true,minver:1,webm:false,description:"The binary value used to represent this segment in the chapter codec data. The format depends on the ChapProcessCodecID used."},0x69bf:{name:"ChapterTranslateCodec",level:3,type:"u",mandatory:true,minver:1,webm:false,description:"The chapter codec using this ID (0: Matroska Script, 1: DVD-menu)."},0x69fc:{name:"ChapterTranslateEditionUID",level:3,type:"u",multiple:true,minver:1,webm:false,description:"Specify an edition UID on which this correspondance applies. When not specified, it means for all editions found in the segment."},0x3e83bb:{name:"NextFilename",level:2,type:"8",minver:1,webm:false,description:"An escaped filename corresponding to the next segment."},0x3eb923:{name:"NextUID",level:2,type:"b",minver:1,webm:false,bytesize:16,description:"A unique ID to identify the next chained segment (128 bits)."},0x3c83ab:{name:"PrevFilename",level:2,type:"8",minver:1,webm:false,description:"An escaped filename corresponding to the previous segment."},0x3cb923:{name:"PrevUID",level:2,type:"b",minver:1,webm:false,bytesize:16,description:"A unique ID to identify the previous chained segment (128 bits)."},0x73a4:{name:"SegmentUID",level:2,type:"b",minver:1,webm:false,range:"not 0",bytesize:16,description:"A randomly generated unique ID to identify the current segment between many others (128 bits)."},0x1549a966:{name:"Info",level:1,type:"m",mandatory:true,multiple:true,minver:1,description:"Contains miscellaneous general information and statistics on the file."},0x53ac:{name:"SeekPosition",level:3,type:"u",mandatory:true,minver:1,description:"The position of the element in the segment in octets (0 = first level 1 element).",position:"segment"},0x53ab:{name:"SeekID",level:3,type:"b",mandatory:true,minver:1,description:"The binary ID corresponding to the element name.",type2:"ebmlID"},0x4dbb:{name:"Seek",cppname:"SeekPoint",level:2,type:"m",mandatory:true,multiple:true,minver:1,description:"Contains a single seek entry to an EBML element."},0x114d9b74:{name:"SeekHead",cppname:"SeekHeader",level:1,type:"m",multiple:true,minver:1,description:"Contains the position of other level 1 elements."},0x7e7b:{name:"SignatureElementList",level:2,type:"m",multiple:true,webm:false,i:"Cluster|Block|BlockAdditional",description:"A list consists of a number of consecutive elements that represent one case where data is used in signature. Ex:  means that the BlockAdditional of all Blocks in all Clusters is used for encryption."},0x7e5b:{name:"SignatureElements",level:1,type:"m",webm:false,description:"Contains elements that will be used to compute the signature."},0x7eb5:{name:"Signature",level:1,type:"b",webm:false,description:"The signature of the data (until a new."},0x7ea5:{name:"SignaturePublicKey",level:1,type:"b",webm:false,description:"The public key to use with the algorithm (in the case of a PKI-based signature)."},0x7e9a:{name:"SignatureHash",level:1,type:"u",webm:false,description:"Hash algorithm used (1=SHA1-160, 2=MD5)."},0x7e8a:{name:"SignatureAlgo",level:1,type:"u",webm:false,description:"Signature algorithm used (1=RSA, 2=elliptic)."},0x1b538667:{name:"SignatureSlot",level:-1,type:"m",multiple:true,webm:false,description:"Contain signature of some (coming) elements in the stream."},0xbf:{name:"CRC-32",level:-1,type:"b",minver:1,webm:false,description:"The CRC is computed on all the data of the Master element it's in. The CRC element should be the first in it's parent master for easier reading. All level 1 elements should include a CRC-32. The CRC in use is the IEEE CRC32 Little Endian",crc:true},0xec:{name:"Void",level:-1,type:"b",minver:1,description:"Used to void damaged data, to avoid unexpected behaviors when using damaged data. The content is discarded. Also used to reserve space in a sub-element for later use."},0x42f3:{name:"EBMLMaxSizeLength",level:1,type:"u",mandatory:true,"default":8,minver:1,description:"The maximum length of the sizes you'll find in this file (8 or less in Matroska). This does not override the element size indicated at the beginning of an element. Elements that have an indicated size which is larger than what is allowed by EBMLMaxSizeLength shall be considered invalid."},0x42f2:{name:"EBMLMaxIDLength",level:1,type:"u",mandatory:true,"default":4,minver:1,description:"The maximum length of the IDs you'll find in this file (4 or less in Matroska)."},0x42f7:{name:"EBMLReadVersion",level:1,type:"u",mandatory:true,"default":1,minver:1,description:"The minimum EBML version a parser has to support to read this file."},0x1a45dfa3:{name:"EBML",level:"0",type:"m",mandatory:true,multiple:true,minver:1,description:"Set the EBML characteristics of the data to follow. Each EBML document has to start with this."}};var byName={};var schema={byEbmlID:byEbmlID,byName:byName}
for(var ebmlID in byEbmlID){var desc=byEbmlID[ebmlID];byName[desc.name.replace('-','_')]=parseInt(ebmlID,10);}
module.exports=schema;},{}],18:[function(require,module,exports){module.exports={"name":"ts-ebml","version":"2.0.2","description":"ebml decoder and encoder","scripts":{"setup":"npm install -g http-server;","init":"npm run update; npm run mkdir; npm run build","update":"npm run reset; npm update","reset":"rm -rf node_modules","mkdir":"mkdir lib dist 2>/dev/null","clean":"rm -rf lib/* dist/* test/*.js; mkdir -p dist","build":"npm run clean   && tsc    -p .; npm run browserify","start":"http-server . -s & tsc -w -p .& watchify lib/example_seekable.js -o test/example_seekable.js","stop":"killall -- node */tsc -w -p","browserify":"browserify lib/index.js --standalone EBML -o dist/EBML.js","watchify":"watchify lib/index.js --standalone EBML -o dist/EBMl.js -v","test":"tsc; espower lib/test.js > lib/test.tmp; mv -f lib/test.tmp lib/test.js; browserify lib/test.js -o test/test.js","example":"tsc; browserify lib/example_seekable.js -o test/example_seekable.js","examples":"tsc; for file in `find lib -name 'example_*.js' -type f -printf '%f\\n'`; do browserify lib/$file -o test/$file; done","examples_bsd":"tsc; for file in `find lib -name 'example_*.js' -type f -print`; do browserify lib/$(basename $file) -o test/$(basename $file); done","check":"tsc -w --noEmit -p ./","lint":"tslint -c ./tslint.json --project ./tsconfig.json --type-check","doc":"typedoc --mode modules --out doc --disableOutputCheck"},"repository":{"type":"git","url":"git+https://github.com/legokichi/ts-ebml.git"},"keywords":["ebml","webm","mkv","matrosika","webp"],"author":"legokichi duckscallion","license":"MIT","bugs":{"url":"https://github.com/legokichi/ts-ebml/issues"},"homepage":"https://github.com/legokichi/ts-ebml#readme","dependencies":{"buffer":"^5.0.7","commander":"^2.11.0","ebml":"^2.2.1","ebml-block":"^1.1.0","events":"^1.1.1","int64-buffer":"^0.1.9","matroska":"^2.2.3"},"devDependencies":{"@types/commander":"^2.9.1","@types/qunit":"^2.0.31","browserify":"^13.1.0","empower":"^1.2.3","espower-cli":"^1.1.0","power-assert":"^1.4.4","power-assert-formatter":"^1.4.1","qunit-tap":"^1.5.1","qunitjs":"^2.4.0","tslint":"^3.15.1","typedoc":"^0.5.3","typescript":"^2.4.2","watchify":"^3.7.0"},"bin":"./lib/cli.js","main":"./lib/index.js","typings":"./lib/index.d.ts"}},{}]},{},[4])(4)});