from simple_term_menu import TerminalMenu
from handleCommand import addVoting, printVotings, vote, printVotingResults, printNodes, addNode, save
import traceback
# import logging
from log import log
import os
from sendUDP import sendUDP
from commons import thisNode





def showUI():
	options = ["create a new voting","print existing votings", "cast a vote", "print voting results","print avaliable nodes", "add a node(if not found automatically)", "save this nodes state","resend discovery broadcast", "exit"]
	terminal_menu = TerminalMenu(options)
	try:
		exit = False
		while not exit:
			print("\nWhat would You like to do?")
			menu_entry_index = terminal_menu.show()
			#0 - addVoting
			#1 - printVotings
			#2 - vote
			#3 - printVotingResults
			#4 - printNodes #TO BE IMPLEMENTED
			#5 - addNode
			#6 - save
			match menu_entry_index:
				case 0:
					addVoting()
				case 1:
					printVotings()
				case 2:
					vote()
				case 3:
					printVotingResults()
				case 4:
					printNodes()
				case 5:
					addNode()
				case 6:
					save()
				case 7:
					sendUDP(thisNode.getId(), thisNode.getPort())
				case 8:
					exit = True
		print("exiting the application")
		os._exit(0)
	except Exception as e:
		print("exception occured: traceback: ", traceback.format_exc())

		# logging.basicConfig(filename='logs/error.log',level=logging.DEBUG)
		# logging.debug(traceback.format_exc())
		log("ui exception.\n", traceback.format_exc())






