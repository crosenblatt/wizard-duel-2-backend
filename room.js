class Room {
    
    constructor(){
      this.name = this.generateRoomName()
      this.size = 0;
      this.players = [];
    }

    // create random room name
    generateRoomName(){
      let r = Math.random().toString(36).substring(7);
      return r
    }
  
    // add player to room
    addPlayer(player){
      this.players.push(player);
      this.size += 1;
    }
    
    // clear the room (call this when the game ends)
    clearRoom(){
      this.size = 0;
      this.players = []
    }
  
    // get the # of students in the room
    getSize(){
      return this.size;
    }
  
  }

  module.exports = Room;