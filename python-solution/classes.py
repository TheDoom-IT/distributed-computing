import pickle
import socket #to get ip
from datetime import datetime, timedelta
# from settings import date_format



class node:
	node_id = None
	node_ip = None
	node_port = None

	def __init__(self, node_id: str, ip_address: str, port: int):
		print("creating node: ", node_id, " addr: ", ip_address, " port: ", port)
		self.node_id = node_id
		self.node_ip = ip_address
		self.node_port = port

	def setId(self, node_id: str):
		print("old id: ", self.node_id," new id: ", node_id)
		self.node_id = node_id

	def setIp(self, ip_address: str):
		self.ip_address = ip_address

	def setPort(self, port: int):
		self.port = port

	def getId(self):
		return self.node_id

	def getIp(self):
		return self.ip_address

	def getPort(self):
		return self.port

	def __str__(self):
		return("nodeId: ", self.node_id, " ip: ", self.ip_address, " port: ", self.port)

class vote:
	voter_id = None
	vote_option = None

	def __init__(self, voter_id: str, vote_option: int):
		self.voter_id = voter_id
		self.vote_option = vote_option

	def getVoter(self):
		return self.voter_id

	def getVoteOption(self):
		return(self.vote_option)



class voting:
	voting_id = None
	host_node_id = None
	question = None
	end_time = None
	vote_options = None
	votes = None
	vote_results = None

	def __init__(self, voting_id:str, host_node_id: str, question:str, end_time, vote_options):
		self.voting_id = voting_id
		self.host_node_id = host_node_id
		self.question = question
		if isinstance(end_time, float):
			print("got endtime as float")
			self.end_time = end_time#datetime.strptime(end_time, date_format)
		elif isinstance(end_time, int):
			print("got endtime as int")
			dt = datetime.now() + timedelta(minutes = end_time)
			self.end_time = datetime.timestamp(dt)
		else:
			print("unsupported endtime type ", type(end_time))
		self.vote_options = vote_options
		self.votes = {}
		self.vote_results = [0]*len(self.vote_options)
		print("\nvoting created")
		print("id: ", self.voting_id)
		print("node id: ", self.host_node_id)
		print("question: ", self.question)
		print("end_time: ", self.end_time)
		print("vote options: ", self.vote_options)

	# def getEndtimeStr(self):
	# 	return self.end_time.strftime(date_format)

	def getVoteOptionsString(self):
		string = "["
		for vote_option in self.vote_options:
			if len(string) > 1:
				string += ", "
			string +="\""+str(vote_option)+"\""
		string += "]"
		return string

	def castVote(self, node_id, option:int):
		print("casting vote: ",option, " node id: ", node_id)
		if node_id in self.votes:
			self.vote_results[self.votes[node_id]] -= 1 #nullify previous vote if exists
		self.votes[node_id] = option #cast current vote (overrides previous vote if exists)
		self.vote_results[option] += 1 #count current vote



class thisNode(node):
	known_nodes = {}
	active_voting = None
	def __init__ (self):
		pass
		# self.ip_address = socket.gethostbyname(socket.gethostname())

	# def __init__(self, id):
	# 	self.node_id = id
	# 	self.ip_address = socket.gethostbyname(socket.gethostname())
	# 	print("\n\nnode created\nnode id: ", self.node_id,"\nip address: ", self.ip_address)

	def save(self):
		print(pickle(self))
	
	def addNode(self, id, ip, port):
		self.known_nodes[id] = node(id, ip, port)
		print("added node: ")



