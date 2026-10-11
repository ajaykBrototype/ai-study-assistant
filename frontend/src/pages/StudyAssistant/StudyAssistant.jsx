import { useState } from "react";
import { askAgent } from "../../services/agentApi";
import "./StudyAssistant.css";

function StudyAssistant() {
    const [message, setMessage] = useState("");
    const [answer, setAnswer] = useState("");
    const [iterations, setIterations] = useState(null);
    const [activity, setActivity] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleAsk = async () => {
        if (!message.trim()) return;

        try {
            setLoading(true);
            setError("");
            setAnswer("");
            setActivity([]);
            setIterations(null);

            const response = await askAgent(message);

            setAnswer(response.data.answer);
            setIterations(response.data.iterations);
            setActivity(response.data.activity || []);

        } catch (error) {
            console.error("Agent Error:", error);

            setError(
                error.response?.data?.message ||
                "Something went wrong. Please try again."
            );

        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (event) => {
        if (event.key === "Enter") {
            handleAsk();
        }
    };

    const renderActivity = (event, index) => {
        switch (event.type) {

            case "decision":
                return (
                    <div
                        className="activity-event"
                        key={index}
                    >
                        <div className="event-title">
                            🤖 Iteration {event.iteration}
                        </div>

                        <div className="event-detail">
                            Decision:{" "}
                            <span>{event.action}</span>
                        </div>

                        {event.tool && (
                            <div className="event-detail">
                                Tool:{" "}
                                <span>{event.tool}</span>
                            </div>
                        )}
                    </div>
                );

            case "tool":
                return (
                    <div
                        className="activity-event"
                        key={index}
                    >
                        <div className="event-title">
                            🔧 MCP Tool
                        </div>

                        <div className="event-detail">
                            {event.tool}
                        </div>
                    </div>
                );

            case "retrieval":
                return (
                    <div
                        className="activity-event"
                        key={index}
                    >
                        <div className="event-title">
                            📚 RAG Retrieval
                        </div>

                        <div className="event-detail">
                            Source:{" "}
                            <span>{event.source}</span>
                        </div>

                        {typeof event.score === "number" && (
                            <div className="event-detail">
                                Similarity:{" "}
                                <span>
                                    {event.score.toFixed(3)}
                                </span>
                            </div>
                        )}
                    </div>
                );

            case "final":
                return (
                    <div
                        className="activity-event final-event"
                        key={index}
                    >
                        <div className="event-title">
                            ✅ Final
                        </div>

                        <div className="event-detail">
                            Agent completed the task
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="assistant-page">

            <div className="assistant-container">

                {/* Header */}

                <header className="assistant-header">
                    <h1>AI Study Assistant</h1>

                    <p>
                        Ask questions from your study notes
                        using Agentic AI, MCP and RAG.
                    </p>
                </header>


                {/* Question Input */}

                <section className="question-section">

                    <div className="input-wrapper">

                        <input
                            type="text"
                            value={message}
                            onChange={(event) =>
                                setMessage(event.target.value)
                            }
                            onKeyDown={handleKeyDown}
                            placeholder="Ask something about your study notes..."
                            disabled={loading}
                        />

                        <button
                            onClick={handleAsk}
                            disabled={
                                loading ||
                                !message.trim()
                            }
                        >
                            {loading ? "Thinking..." : "Ask"}
                        </button>

                    </div>

                </section>


                {/* Error */}

                {error && (
                    <div className="error-message">
                        <span>⚠️</span>
                        {error}
                    </div>
                )}


                {/* Loading */}

                {loading && (
                    <div className="loading-message">
                        <div className="loader"></div>

                        <span>
                            Agent is working...
                        </span>
                    </div>
                )}


                {/* Agent Activity */}

                {iterations && (
                    <section className="card activity-card">

                        <div className="card-header">

                            <div>
                                <h2>Agent Activity</h2>

                                <p>
                                    Observe → Decide → Act
                                </p>
                            </div>

                            <div className="iteration-badge">
                                {iterations}{" "}
                                {iterations === 1
                                    ? "Iteration"
                                    : "Iterations"}
                            </div>

                        </div>


                        <div className="activity-list">

                            {activity.length > 0 ? (
                                activity.map(
                                    renderActivity
                                )
                            ) : (
                                <div className="empty-activity">
                                    No activity information available.
                                </div>
                            )}

                        </div>

                    </section>
                )}


                {/* Answer */}

                {answer && (
                    <section className="card answer-card">

                        <div className="card-header">

                            <div>
                                <h2>Answer</h2>

                                <p>
                                    Generated using your study material
                                </p>
                            </div>

                            <div className="answer-icon">
                                ✨
                            </div>

                        </div>

                        <div className="answer-content">
                            {answer}
                        </div>

                    </section>
                )}

            </div>

        </div>
    );
}

export default StudyAssistant;